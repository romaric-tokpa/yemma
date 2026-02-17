"""
Endpoints API pour les offres d'emploi des entreprises.
Même fonctionnalités que l'admin mais filtrées par company_id.
"""
from datetime import datetime, timezone
from typing import List

import logging
import traceback

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, require_company_role, TokenData
from app.infrastructure.repositories import JobOfferRepository, ApplicationRepository, ProfileRepository
from app.domain.models import JobOffer, JobStatus, Application
from app.domain.schemas import (
    JobOfferCreate, JobOfferUpdate, JobOfferResponse, JobApplicationResponse,
    ExperienceResponse, EducationResponse, CertificationResponse, SkillResponse, JobPreferenceResponse,
)

router = APIRouter(prefix="/company/jobs", tags=["company-jobs"])
logger = logging.getLogger(__name__)


class RenewJobRequest(BaseModel):
    """Corps de requête pour reconduire une offre."""
    expires_at: str = Field(..., description="Nouvelle date d'expiration (YYYY-MM-DD)")


class ApplicationStatusUpdate(BaseModel):
    """Corps pour la mise à jour du statut d'une candidature"""
    status: str = Field(..., description="Nouveau statut")
    rejection_reason: str | None = Field(default=None, max_length=2000)


APPLICATION_STATUS_VALUES = [
    "PENDING", "TO_INTERVIEW", "INTERVIEW_SCHEDULED", "INTERVIEW_DONE",
    "HIRED", "REJECTED", "EXTERNAL_REDIRECT", "REVIEWED", "ACCEPTED",
]


def get_company_id(x_company_id: str | None = Header(None, alias="X-Company-Id")) -> int:
    """Récupère et valide company_id depuis le header X-Company-Id."""
    if not x_company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Header X-Company-Id requis"
        )
    try:
        return int(x_company_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Company-Id doit être un entier"
        )


async def require_company_dep(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """Dépendance pour exiger le rôle entreprise."""
    return require_company_role(current_user)


def _serialize_job_preferences(jp):
    """Sérialise job_preferences en dict ou None."""
    if jp is None:
        return None
    try:
        return JobPreferenceResponse.model_validate(jp).model_dump()
    except Exception:
        return {
            "desired_positions": getattr(jp, "desired_positions", []) or [],
            "contract_type": getattr(jp, "contract_type", None),
            "contract_types": getattr(jp, "contract_types", []) or [],
            "target_sectors": getattr(jp, "target_sectors", []) or [],
            "desired_location": getattr(jp, "desired_location", None),
            "availability": getattr(jp, "availability", None),
            "remote_preference": getattr(jp, "remote_preference", None),
            "salary_min": getattr(jp, "salary_min", None),
            "salary_max": getattr(jp, "salary_max", None),
        }


def _ensure_job_belongs_to_company(job: JobOffer | None, company_id: int) -> JobOffer:
    """Vérifie que l'offre appartient à l'entreprise."""
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    if job.company_id != company_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    return job


@router.get("/stats")
async def company_jobs_stats(
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_company_dep),
    company_id: int = Depends(get_company_id),
):
    """Statistiques des offres de l'entreprise."""
    return await JobOfferRepository.get_stats_by_company(session, company_id)


@router.get("", response_model=List[JobOfferResponse])
async def company_list_jobs(
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_company_dep),
    company_id: int = Depends(get_company_id),
):
    """Liste les offres de l'entreprise avec le nombre de candidatures par offre."""
    jobs = await JobOfferRepository.list_by_company(session, company_id)
    job_ids = [j.id for j in jobs]
    counts = await ApplicationRepository.count_by_job_ids(session, job_ids)
    result = []
    for j in jobs:
        data = JobOfferResponse.model_validate(j).model_dump()
        data["applications_count"] = counts.get(j.id, 0)
        result.append(JobOfferResponse(**data))
    return result


@router.post("", response_model=JobOfferResponse, status_code=status.HTTP_201_CREATED)
async def company_create_job(
    job_data: JobOfferCreate,
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_company_dep),
    company_id: int = Depends(get_company_id),
):
    """Crée une offre pour l'entreprise."""
    data = job_data.model_dump()
    data["status"] = JobStatus.DRAFT
    data["company_id"] = company_id
    job = await JobOfferRepository.create(session, data)
    return JobOfferResponse.model_validate(job)


@router.get("/{job_id}", response_model=JobOfferResponse)
async def company_get_job(
    job_id: int,
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_company_dep),
    company_id: int = Depends(get_company_id),
):
    """Détail d'une offre de l'entreprise."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    _ensure_job_belongs_to_company(job, company_id)
    return JobOfferResponse.model_validate(job)


@router.get("/{job_id}/candidates/{candidate_id}/profile")
async def company_get_candidate_profile(
    job_id: int,
    candidate_id: int,
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_company_dep),
    company_id: int = Depends(get_company_id),
):
    """Profil complet d'un candidat ayant postulé à cette offre. Réservé aux entreprises propriétaires de l'offre."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    _ensure_job_belongs_to_company(job, company_id)
    app_result = await session.execute(
        select(Application).where(
            Application.job_offer_id == job_id,
            Application.candidate_id == candidate_id,
        )
    )
    app = app_result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidat non trouvé pour cette offre")
    profile = await ProfileRepository.get_with_relations(session, candidate_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil non trouvé")
    def _safe_serialize(items, schema_class, default=None):
        out = default if default is not None else []
        for item in items or []:
            try:
                out.append(schema_class.model_validate(item).model_dump())
            except Exception:
                logger.warning("Skip invalid item in %s", schema_class.__name__)
        return out

    try:
        response_data = {
            "id": profile.id,
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "email": profile.email,
            "profile_title": profile.profile_title,
            "professional_summary": profile.professional_summary,
            "sector": profile.sector,
            "main_job": profile.main_job,
            "total_experience": profile.total_experience,
            "phone": profile.phone,
            "city": profile.city,
            "country": profile.country,
            "photo_url": profile.photo_url,
            "status": str(profile.status) if profile.status else "DRAFT",
            "admin_report": profile.admin_report,
            "experiences": _safe_serialize(profile.experiences, ExperienceResponse),
            "educations": _safe_serialize(profile.educations, EducationResponse),
            "certifications": _safe_serialize(profile.certifications, CertificationResponse),
            "skills": _safe_serialize(profile.skills, SkillResponse),
            "job_preferences": _serialize_job_preferences(profile.job_preferences),
        }
        if profile.date_of_birth:
            response_data["date_of_birth"] = profile.date_of_birth.isoformat()
        if profile.nationality:
            response_data["nationality"] = profile.nationality
        return response_data
    except Exception as e:
        logger.error("company_get_candidate_profile error: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{job_id}/applications", response_model=List[JobApplicationResponse])
async def company_list_job_applications(
    job_id: int,
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_company_dep),
    company_id: int = Depends(get_company_id),
):
    """Liste les candidatures pour une offre de l'entreprise."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    _ensure_job_belongs_to_company(job, company_id)
    try:
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
    except Exception as e:
        logger.error("company_list_job_applications error: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{job_id}/applications/{application_id}/status")
async def company_update_application_status(
    job_id: int,
    application_id: int,
    body: ApplicationStatusUpdate = Body(...),
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_company_dep),
    company_id: int = Depends(get_company_id),
):
    """Met à jour le statut d'une candidature."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    _ensure_job_belongs_to_company(job, company_id)
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


@router.patch("/{job_id}", response_model=JobOfferResponse)
async def company_update_job(
    job_id: int,
    job_data: JobOfferUpdate,
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_company_dep),
    company_id: int = Depends(get_company_id),
):
    """Met à jour une offre de l'entreprise."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    _ensure_job_belongs_to_company(job, company_id)
    data = {k: v for k, v in job_data.model_dump(exclude_unset=True).items()}
    if "status" in data and data["status"] not in ("DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"):
        data.pop("status")
    data["company_id"] = company_id
    job = await JobOfferRepository.update(session, job_id, data)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    return JobOfferResponse.model_validate(job)


@router.post("/{job_id}/renew", response_model=JobOfferResponse)
async def company_renew_job(
    job_id: int,
    body: RenewJobRequest = Body(...),
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_company_dep),
    company_id: int = Depends(get_company_id),
):
    """Reconduire une offre expirée ou archivée."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    _ensure_job_belongs_to_company(job, company_id)
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
    if exp_dt <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La date d'expiration doit être dans le futur.")
    exp_dt_end = exp_dt.replace(hour=23, minute=59, second=59, microsecond=0) if len(expires_at) <= 10 else exp_dt
    job = await JobOfferRepository.update(session, job_id, {"expires_at": exp_dt_end, "status": JobStatus.PUBLISHED})
    return JobOfferResponse.model_validate(job)


@router.patch("/{job_id}/status", response_model=JobOfferResponse)
async def company_update_job_status(
    job_id: int,
    status_value: str = Query(..., description="DRAFT, PUBLISHED, CLOSED ou ARCHIVED"),
    session: AsyncSession = Depends(get_session),
    _: TokenData = Depends(require_company_dep),
    company_id: int = Depends(get_company_id),
):
    """Publie, dépublie, ferme ou archive une offre."""
    job = await JobOfferRepository.get_by_id(session, job_id)
    _ensure_job_belongs_to_company(job, company_id)
    if status_value not in ("DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statut invalide")
    job = await JobOfferRepository.update(session, job_id, {"status": status_value})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre non trouvée")
    return JobOfferResponse.model_validate(job)
