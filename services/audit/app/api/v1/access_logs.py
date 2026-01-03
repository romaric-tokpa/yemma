"""
Endpoints de gestion des logs d'accès
"""
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, status, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.domain.schemas import (
    AccessLogCreate,
    AccessLogResponse,
    AccessLogListResponse,
    AccessLogStatsResponse,
    CandidateAccessSummaryResponse,
    CompanyAccessSummary,
)
from app.domain.models import AccessLog
from app.infrastructure.database import get_session
from app.infrastructure.repositories import AccessLogRepository
from app.infrastructure.auth import require_candidate_access, TokenData, get_current_user
from app.infrastructure.internal_auth import verify_internal_token

router = APIRouter()


@router.post("", response_model=AccessLogResponse, status_code=status.HTTP_201_CREATED)
async def create_access_log(
    request: Request,
    log_data: AccessLogCreate,
    session: AsyncSession = Depends(get_session),
    service_info: Optional[dict] = Depends(verify_internal_token)
):
    """
    Enregistre un log d'accès (Qui, Quand, Quel profil)
    
    Appelé automatiquement lorsqu'un recruteur consulte un profil candidat.
    
    **Protection** : Requiert un token de service interne (X-Service-Token)
    """
    # Vérifier que la requête provient d'un service interne
    if not service_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This endpoint requires a service token. Use /api/v1/audit/log for internal service calls."
        )
    repo = AccessLogRepository(session)
    
    # Récupérer l'IP et User-Agent depuis la requête
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # Créer le log
    access_log = AccessLog(
        recruiter_id=log_data.recruiter_id,
        recruiter_email=log_data.recruiter_email,
        recruiter_name=log_data.recruiter_name,
        company_id=log_data.company_id,
        company_name=log_data.company_name,
        candidate_id=log_data.candidate_id,
        candidate_email=log_data.candidate_email,
        candidate_name=log_data.candidate_name,
        access_type=log_data.access_type,
        action_type=log_data.action_type,
        ip_address=ip_address or log_data.ip_address,
        user_agent=user_agent or log_data.user_agent,
        metadata=json.dumps(log_data.metadata) if log_data.metadata else None,
    )
    
    access_log = await repo.create(access_log)
    return AccessLogResponse.model_validate(access_log)


@router.post("/log", response_model=AccessLogResponse, status_code=status.HTTP_201_CREATED)
async def log_access(
    request: Request,
    log_data: AccessLogCreate,
    session: AsyncSession = Depends(get_session),
    service_info: dict = Depends(verify_internal_token)
):
    """
    Enregistre un log d'accès (endpoint protégé par token interne)
    
    Cet endpoint est spécifiquement conçu pour les appels inter-services.
    Il est protégé par un token de service interne (X-Service-Token).
    
    **Protection** : Requiert un token de service interne (X-Service-Token)
    
    **Usage** : Appelé par les autres services (Search, Document, etc.) pour enregistrer
    les accès aux profils candidats.
    
    **Exemple d'appel** :
    ```python
    headers = {"X-Service-Token": generate_service_token("search-service")}
    response = await client.post(
        f"{AUDIT_SERVICE_URL}/api/v1/audit/log",
        json=log_data,
        headers=headers
    )
    ```
    """
    repo = AccessLogRepository(session)
    
    # Récupérer l'IP et User-Agent depuis la requête
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # Créer le log
    access_log = AccessLog(
        recruiter_id=log_data.recruiter_id,
        recruiter_email=log_data.recruiter_email,
        recruiter_name=log_data.recruiter_name,
        company_id=log_data.company_id,
        company_name=log_data.company_name,
        candidate_id=log_data.candidate_id,
        candidate_email=log_data.candidate_email,
        candidate_name=log_data.candidate_name,
        access_type=log_data.access_type,
        action_type=log_data.action_type,
        ip_address=ip_address or log_data.ip_address,
        user_agent=user_agent or log_data.user_agent,
        metadata=json.dumps(log_data.metadata) if log_data.metadata else None,
    )
    
    access_log = await repo.create(access_log)
    return AccessLogResponse.model_validate(access_log)


@router.get("/{log_id}", response_model=AccessLogResponse)
async def get_access_log(
    log_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère un log d'accès par ID
    """
    repo = AccessLogRepository(session)
    access_log = await repo.get_by_id(log_id)
    
    if not access_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access log not found"
        )
    
    return AccessLogResponse.model_validate(access_log)


@router.get("", response_model=AccessLogListResponse)
async def list_access_logs(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    candidate_id: Optional[int] = Query(default=None),
    recruiter_id: Optional[int] = Query(default=None),
    company_id: Optional[int] = Query(default=None),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    session: AsyncSession = Depends(get_session)
):
    """
    Liste les logs d'accès avec filtres
    
    - **candidate_id**: Filtrer par candidat
    - **recruiter_id**: Filtrer par recruteur
    - **company_id**: Filtrer par entreprise
    - **start_date**: Date de début
    - **end_date**: Date de fin
    """
    repo = AccessLogRepository(session)
    
    if candidate_id:
        logs = await repo.get_by_candidate_id(candidate_id, limit, offset)
        total = len(logs)  # Approximation
    elif recruiter_id:
        logs = await repo.get_by_recruiter_id(recruiter_id, limit, offset)
        total = len(logs)  # Approximation
    elif company_id:
        logs = await repo.get_by_company_id(company_id, limit, offset)
        total = len(logs)  # Approximation
    else:
        logs, total = await repo.get_all(limit, offset, start_date, end_date)
    
    return AccessLogListResponse(
        total=total,
        items=[AccessLogResponse.model_validate(log) for log in logs]
    )


@router.get("/candidate/{candidate_id}", response_model=AccessLogListResponse)
async def get_candidate_access_logs(
    candidate_id: int,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(require_candidate_access(candidate_id))
):
    """
    Récupère tous les logs d'accès pour un candidat (RGPD - Droit à l'information)
    
    Permet à un candidat de voir qui a consulté son profil.
    
    **Sécurité** : Seul le candidat concerné (ou un admin) peut accéder à ces données.
    
    **Conformité RGPD** : Article 15 - Droit d'accès aux données personnelles
    Les candidats ont le droit de savoir qui a consulté leur profil.
    
    Returns:
        AccessLogListResponse: Liste des accès avec pagination
    """
    repo = AccessLogRepository(session)
    
    # Récupérer les logs avec pagination
    logs = await repo.get_by_candidate_id(candidate_id, limit, offset)
    
    # Récupérer le total pour la pagination
    total = await repo.count_by_candidate_id(candidate_id)
    
    return AccessLogListResponse(
        total=total,
        items=[AccessLogResponse.model_validate(log) for log in logs]
    )


@router.get("/recruiter/{recruiter_id}", response_model=AccessLogListResponse)
async def get_recruiter_access_logs(
    recruiter_id: int,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère tous les logs d'accès pour un recruteur
    """
    repo = AccessLogRepository(session)
    logs = await repo.get_by_recruiter_id(recruiter_id, limit, offset)
    
    return AccessLogListResponse(
        total=len(logs),
        items=[AccessLogResponse.model_validate(log) for log in logs]
    )


@router.get("/company/{company_id}", response_model=AccessLogListResponse)
async def get_company_access_logs(
    company_id: int,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère tous les logs d'accès pour une entreprise
    """
    repo = AccessLogRepository(session)
    logs = await repo.get_by_company_id(company_id, limit, offset)
    
    return AccessLogListResponse(
        total=len(logs),
        items=[AccessLogResponse.model_validate(log) for log in logs]
    )


@router.get("/stats/summary", response_model=AccessLogStatsResponse)
async def get_access_stats(
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère les statistiques d'accès
    
    - **start_date**: Date de début (défaut: 30 derniers jours)
    - **end_date**: Date de fin (défaut: aujourd'hui)
    """
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    repo = AccessLogRepository(session)
    stats = await repo.get_stats(start_date, end_date)
    
    return AccessLogStatsResponse(**stats)


@router.get("/candidate/me", response_model=CandidateAccessSummaryResponse)
async def get_my_access_summary(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    Récupère le résumé des accès pour le candidat connecté (RGPD - Droit à l'information)
    
    Retourne uniquement la liste des entreprises (nom uniquement) qui ont consulté le profil,
    conformément au droit à l'information RGPD.
    
    **Sécurité** : Seul le candidat connecté peut accéder à ses propres données.
    
    **Conformité RGPD** : Article 15 - Droit d'accès aux données personnelles
    Les candidats ont le droit de savoir quelles entreprises ont consulté leur profil.
    
    Returns:
        CandidateAccessSummaryResponse: Résumé avec liste des entreprises et nombre d'accès
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    candidate_id = current_user.user_id
    
    repo = AccessLogRepository(session)
    
    # Récupérer les entreprises uniques qui ont consulté ce candidat
    companies_summary = await repo.get_companies_by_candidate_id(candidate_id, limit, offset)
    
    # Calculer le total
    total_accesses = await repo.count_by_candidate_id(candidate_id)
    unique_companies = await repo.count_unique_companies_by_candidate_id(candidate_id)
    
    # Convertir en schémas
    companies_list = [
        CompanyAccessSummary(
            company_id=company["company_id"],
            company_name=company["company_name"],
            access_count=company["access_count"],
            last_access=company["last_access"]
        )
        for company in companies_summary
    ]
    
    return CandidateAccessSummaryResponse(
        candidate_id=candidate_id,
        total_accesses=total_accesses,
        unique_companies=unique_companies,
        companies=companies_list
    )


