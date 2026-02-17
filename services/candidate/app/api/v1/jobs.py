"""
Endpoints API pour les offres d'emploi (effet Leurre)
- Candidat : lister, voir détail, postuler (avec vérification profil complet)
- Admin : créer, modifier, publier/dépublier
"""
from datetime import datetime, timezone
from typing import List, Optional
import logging
import traceback

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, require_current_user, require_admin_role_dep, TokenData
from app.infrastructure.repositories import ProfileRepository, JobOfferRepository, ApplicationRepository
from app.domain.models import Profile, JobOffer, JobStatus, ProfileStatus
from app.domain.schemas import JobOfferCreate, JobOfferUpdate, JobOfferResponse, ApplicationCreate, JobApplicationResponse
from app.core.completion import check_cv_exists, calculate_completion_percentage

router = APIRouter(tags=["jobs"])
logger = logging.getLogger(__name__)


class RenewJobRequest(BaseModel):
    """Corps de requête pour reconduire une offre."""
    expires_at: str = Field(..., description="Nouvelle date d'expiration (YYYY-MM-DD)")


# --- PUBLIC / CANDIDAT ---

@router.get("/jobs", response_model=List[JobOfferResponse])
async def list_jobs(
    title: Optional[str] = Query(None, description="Filtre par intitulé de poste (recherche partielle)"),
    location: Optional[str] = Query(None, description="Filtre par localisation"),
    contract_type: Optional[str] = Query(None, description="Filtre par type de contrat (CDI, CDD, etc.)"),
    company: Optional[str] = Query(None, description="Filtre par nom d'entreprise"),
    sector: Optional[str] = Query(None, description="Filtre par secteur d'activité"),
    session: AsyncSession = Depends(get_session),
):
    """Liste les offres publiées (accessible sans auth pour découverte). Les offres expirées sont exclues."""
    jobs = await JobOfferRepository.list_published(
        session,
        title=title,
        location=location,
        contract_type=contract_type,
        company=company,
        sector=sector,
    )
    return [JobOfferResponse.model_validate(j) for j in jobs]


@router.get("/jobs/my-applications")
async def get_my_applications(
    current_user: Optional[TokenData] = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Liste les candidatures de l'utilisateur : job_ids et statut par offre."""
    current_user = require_current_user(current_user)
    profile = await ProfileRepository.get_by_user_id(session, current_user.user_id)
    if not profile:
        return {"job_ids": [], "applications": []}
    apps = await ApplicationRepository.list_applications_by_candidate(session, profile.id)
    job_ids = [a[0] for a in apps]
    applications = [
        {"job_id": a[0], "status": a[1], "rejection_reason": a[2] if len(a) > 2 else None}
        for a in apps
    ]
    return {"job_ids": job_ids, "applications": applications}


@router.get("/jobs/{job_id}", response_model=JobOfferResponse)
async def get_job(
    job_id: int,
    session: AsyncSession = Depends(get_session),
):
    """Détail d'une offre (publique si publiée). Incrémente le compteur de vues à chaque consultation."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    if job.status != JobStatus.PUBLISHED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    # Exclure les offres expirées
    if job.expires_at:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        exp = job.expires_at.replace(tzinfo=None) if job.expires_at.tzinfo else job.expires_at
        if exp <= now:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    # Incrémenter le compteur de vues (métrique d'acquisition)
    await JobOfferRepository.increment_view_count(session, job_id)
    job = await JobOfferRepository.get_by_id(session, job_id)
    return JobOfferResponse.model_validate(job)


@router.post("/jobs/{job_id}/register-click")
async def track_register_click(
    job_id: int,
    session: AsyncSession = Depends(get_session),
):
    """
    Enregistre un clic sur "Créer mon compte" depuis la modal affichée après avoir cliqué sur Postuler
    sur la page /offres/{id}. Appelé par le frontend sans authentification.
    """
    ok = await JobOfferRepository.increment_register_click_count(session, job_id)
    return {"ok": ok}


@router.get("/jobs/{job_id}/application-status")
async def get_application_status(
    job_id: int,
    current_user: Optional[TokenData] = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Indique si l'utilisateur connecté a déjà postulé à cette offre."""
    current_user = require_current_user(current_user)
    profile = await ProfileRepository.get_by_user_id(session, current_user.user_id)
    if not profile:
        return {"applied": False}
    applied = await ApplicationRepository.exists(session, profile.id, job_id)
    return {"applied": applied}


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

    # Vérifier que le profil est validé par l'admin
    if profile.status != ProfileStatus.VALIDATED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre profil doit être validé par un administrateur avant de pouvoir postuler. Veuillez patienter ou contacter le support.",
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

@router.get("/admin/jobs/stats")
async def admin_jobs_stats(
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Statistiques des offres d'emploi (admin)."""
    return await JobOfferRepository.get_stats(session)


@router.get("/admin/jobs", response_model=List[JobOfferResponse])
async def admin_list_jobs(
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Liste toutes les offres (admin)."""
    try:
        jobs = await JobOfferRepository.list_all(session)
        return [JobOfferResponse.model_validate(j) for j in jobs]
    except Exception as e:
        err_msg = str(e).lower()
        if "view_count" in err_msg or "register_click_count" in err_msg or "does not exist" in err_msg or "column" in err_msg and "exist" in err_msg:
            logger.warning("Colonnes view_count/register_click_count absentes. Migration requise: %s", e)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Migration requise. Exécutez : cd services/candidate && alembic upgrade head",
            ) from e
        raise


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


@router.get("/admin/jobs/{job_id}/applications", response_model=List[JobApplicationResponse])
async def admin_list_job_applications(
    job_id: int,
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Liste les candidatures pour une offre (admin)."""
    try:
        job = await JobOfferRepository.get_by_id(session, job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
        rows = await ApplicationRepository.list_by_job(session, job_id)
        result = []
        for app, profile in rows:
            profile_status_val = None
            if profile and profile.status is not None:
                profile_status_val = getattr(profile.status, "value", None) or str(profile.status)
            result.append(JobApplicationResponse(
                id=app.id,
                candidate_id=app.candidate_id,
                job_offer_id=app.job_offer_id,
                status=str(app.status) if app.status is not None else "PENDING",
                applied_at=app.applied_at,
                cover_letter=app.cover_letter,
                first_name=profile.first_name if profile else None,
                last_name=profile.last_name if profile else None,
                email=profile.email if profile else None,
                profile_title=profile.profile_title if profile else None,
                profile_status=profile_status_val,
                photo_url=profile.photo_url if profile else None,
                admin_score=profile.admin_score if profile else None,
                admin_report=profile.admin_report if profile else None,
            ))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("admin_list_job_applications error: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


APPLICATION_STATUS_VALUES = [
    "PENDING",
    "TO_INTERVIEW",
    "INTERVIEW_SCHEDULED",
    "INTERVIEW_DONE",
    "HIRED",
    "REJECTED",
    "EXTERNAL_REDIRECT",
    "REVIEWED",  # rétrocompatibilité
    "ACCEPTED",  # rétrocompatibilité
]


class ApplicationStatusUpdate(BaseModel):
    """Corps pour la mise à jour du statut d'une candidature"""
    status: str = Field(..., description="Nouveau statut")
    rejection_reason: Optional[str] = Field(default=None, max_length=2000, description="Motif de refus (obligatoire si status=REJECTED)")


@router.patch("/admin/jobs/{job_id}/applications/{application_id}/status")
async def admin_update_application_status(
    job_id: int,
    application_id: int,
    body: ApplicationStatusUpdate = Body(...),
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Met à jour le statut d'une candidature (étape de recrutement). Si REJECTED, rejection_reason peut être fourni."""
    status_value = body.status
    if status_value not in APPLICATION_STATUS_VALUES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Statut invalide. Valeurs acceptées : {', '.join(APPLICATION_STATUS_VALUES)}",
        )
    if status_value == "REJECTED" and (not body.rejection_reason or not body.rejection_reason.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez rédiger les motifs de refus pour informer le candidat.",
        )
    app = await ApplicationRepository.update_status(
        session, application_id, job_id, status_value,
        rejection_reason=body.rejection_reason if status_value == "REJECTED" else None,
    )
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidature non trouvée")
    return {"id": app.id, "status": app.status}


@router.patch("/admin/jobs/{job_id}", response_model=JobOfferResponse)
async def update_job(
    job_id: int,
    job_data: JobOfferUpdate,
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Met à jour une offre (admin)."""
    data = {k: v for k, v in job_data.model_dump(exclude_unset=True).items()}
    if "status" in data and data["status"] not in ("DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"):
        data.pop("status")
    job = await JobOfferRepository.update(session, job_id, data)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    return JobOfferResponse.model_validate(job)


@router.post("/admin/jobs/{job_id}/renew", response_model=JobOfferResponse)
async def renew_job(
    job_id: int,
    body: RenewJobRequest = Body(...),
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Reconduire une offre expirée ou archivée : nouvelle date d'expiration + republier."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    is_expired = job.expires_at and (job.expires_at.replace(tzinfo=None) if job.expires_at.tzinfo else job.expires_at) <= now
    can_renew = job.status in (JobStatus.ARCHIVED, JobStatus.CLOSED) or (job.status == JobStatus.PUBLISHED and is_expired)
    if not can_renew:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seules les offres archivées, fermées ou expirées peuvent être reconduites.",
        )
    expires_at = body.expires_at.strip()
    try:
        exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if exp_dt.tzinfo:
            exp_dt = exp_dt.replace(tzinfo=None)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Date d'expiration invalide (format YYYY-MM-DD)")
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if exp_dt <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La date d'expiration doit être dans le futur.")
    exp_dt_end = exp_dt.replace(hour=23, minute=59, second=59, microsecond=0) if len(expires_at) <= 10 else exp_dt
    job = await JobOfferRepository.update(session, job_id, {"expires_at": exp_dt_end, "status": JobStatus.PUBLISHED})
    return JobOfferResponse.model_validate(job)


@router.patch("/admin/jobs/{job_id}/status", response_model=JobOfferResponse)
async def update_job_status(
    job_id: int,
    status_value: str = Query(..., description="DRAFT, PUBLISHED, CLOSED ou ARCHIVED"),
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_admin_role_dep),
):
    """Publie, dépublie, ferme ou archive une offre (admin)."""
    if status_value not in ("DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statut invalide")
    job = await JobOfferRepository.update(session, job_id, {"status": status_value})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    return JobOfferResponse.model_validate(job)
