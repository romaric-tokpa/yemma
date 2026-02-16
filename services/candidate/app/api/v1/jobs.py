"""
Endpoints API pour les offres d'emploi (effet Leurre)
- Candidat : lister, voir détail, postuler (avec vérification profil complet)
- Admin : créer, modifier, publier/dépublier
"""
from typing import List, Optional
import logging

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, require_current_user, require_admin_role_dep, TokenData
from app.infrastructure.repositories import ProfileRepository, JobOfferRepository, ApplicationRepository
from app.domain.models import Profile, JobOffer, JobStatus
from app.domain.schemas import JobOfferCreate, JobOfferUpdate, JobOfferResponse, ApplicationCreate
from app.core.completion import check_cv_exists, calculate_completion_percentage

router = APIRouter(tags=["jobs"])
logger = logging.getLogger(__name__)


# --- PUBLIC / CANDIDAT ---

@router.get("/jobs", response_model=List[JobOfferResponse])
async def list_jobs(
    title: Optional[str] = Query(None, description="Filtre par intitulé de poste (recherche partielle)"),
    location: Optional[str] = Query(None, description="Filtre par localisation"),
    contract_type: Optional[str] = Query(None, description="Filtre par type de contrat (CDI, CDD, etc.)"),
    company: Optional[str] = Query(None, description="Filtre par nom d'entreprise ou secteur"),
    session: AsyncSession = Depends(get_session),
):
    """Liste les offres publiées (accessible sans auth pour découverte)."""
    jobs = await JobOfferRepository.list_published(
        session,
        title=title,
        location=location,
        contract_type=contract_type,
        company=company,
    )
    return [JobOfferResponse.model_validate(j) for j in jobs]


@router.get("/jobs/{job_id}", response_model=JobOfferResponse)
async def get_job(
    job_id: int,
    session: AsyncSession = Depends(get_session),
):
    """Détail d'une offre (publique si publiée)."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    if job.status != JobStatus.PUBLISHED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    return JobOfferResponse.model_validate(job)


@router.post("/jobs/{job_id}/apply")
async def apply_to_job(
    job_id: int,
    body: Optional[ApplicationCreate] = Body(None),
    current_user: Optional[TokenData] = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Postuler à une offre. Point d'acquisition : exige un profil complet à 100%.

    - Non connecté → 401
    - Profil incomplet → 403 avec message invitant à compléter
    - Déjà postulé → 409
    """
    current_user = require_current_user(current_user)

    job = await JobOfferRepository.get_by_id(session, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    if job.status != JobStatus.PUBLISHED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non disponible")

    profile = await ProfileRepository.get_by_user_id_with_relations(session, current_user.user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Créez votre profil expert pour postuler. Inscrivez-vous en 1 clic via Google ou LinkedIn.",
        )

    if settings.REQUIRE_FULL_PROFILE_FOR_APPLY:
        threshold = settings.PROFILE_COMPLETION_THRESHOLD
        completion = profile.completion_percentage or 0
        has_cv = await check_cv_exists(profile.id)
        if completion < threshold:
            recalc = calculate_completion_percentage(profile, has_cv)
            if recalc < threshold:
                pct = int(recalc)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Votre profil est à {pct}%. Les recruteurs ont besoin de savoir qui vous êtes. Complétez-le à {threshold}% pour débloquer votre candidature.",
                )

    if await ApplicationRepository.exists(session, profile.id, job_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vous avez déjà postulé à cette offre.",
        )

    cover_letter = body.cover_letter if body else None

    # Offre externe : redirection URL ou email (toujours acquisition profil avant)
    if job.external_application_url:
        await ApplicationRepository.create(
            session, profile.id, job_id, cover_letter=cover_letter, status="EXTERNAL_REDIRECT"
        )
        return {"message": "Redirection", "redirect_url": job.external_application_url}
    if job.application_email:
        await ApplicationRepository.create(
            session, profile.id, job_id, cover_letter=cover_letter, status="EXTERNAL_REDIRECT"
        )
        return {"message": "Redirection", "application_email": job.application_email}

    # Offre interne : candidature via Yemma
    await ApplicationRepository.create(session, profile.id, job_id, cover_letter=cover_letter)
    return {"message": "Candidature envoyée avec succès"}


# --- ADMIN (protégé par rôle) ---

@router.get("/admin/jobs", response_model=List[JobOfferResponse])
async def admin_list_jobs(
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Liste toutes les offres (admin)."""
    jobs = await JobOfferRepository.list_all(session)
    return [JobOfferResponse.model_validate(j) for j in jobs]


@router.post("/admin/jobs", response_model=JobOfferResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobOfferCreate,
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Crée une offre (admin)."""
    data = job_data.model_dump()
    data["status"] = JobStatus.DRAFT
    job = await JobOfferRepository.create(session, data)
    return JobOfferResponse.model_validate(job)


@router.get("/admin/jobs/{job_id}", response_model=JobOfferResponse)
async def admin_get_job(
    job_id: int,
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Détail d'une offre (admin, tous statuts)."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    return JobOfferResponse.model_validate(job)


@router.patch("/admin/jobs/{job_id}", response_model=JobOfferResponse)
async def update_job(
    job_id: int,
    job_data: JobOfferUpdate,
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Met à jour une offre (admin)."""
    data = {k: v for k, v in job_data.model_dump(exclude_unset=True).items()}
    if "status" in data and data["status"] not in ("DRAFT", "PUBLISHED", "CLOSED"):
        data.pop("status")
    job = await JobOfferRepository.update(session, job_id, data)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    return JobOfferResponse.model_validate(job)


@router.patch("/admin/jobs/{job_id}/status", response_model=JobOfferResponse)
async def update_job_status(
    job_id: int,
    status_value: str = Query(..., description="DRAFT, PUBLISHED ou CLOSED"),
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Publie, dépublie ou ferme une offre (admin)."""
    if status_value not in ("DRAFT", "PUBLISHED", "CLOSED"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statut invalide")
    job = await JobOfferRepository.update(session, job_id, {"status": status_value})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    return JobOfferResponse.model_validate(job)
