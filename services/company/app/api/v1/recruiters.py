"""
Endpoints de gestion des recruteurs
"""
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.schemas import RecruiterResponse, RecruiterDetailResponse, CandidateSearchRequest
from app.domain.models import Recruiter
from app.core.exceptions import RecruiterNotFoundError
from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, TokenData
from app.infrastructure.permissions import require_company_admin, require_recruiter_access, can_view_validated_candidates
from app.infrastructure.repositories import RecruiterRepository, CompanyRepository
import httpx

router = APIRouter()


@router.get("/company/{company_id}", response_model=List[RecruiterResponse])
async def get_company_recruiters(
    company_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère tous les recruteurs d'une entreprise
    
    Accessible par :
    - L'admin de l'entreprise
    - Les super admins
    """
    # Vérifier que l'utilisateur est admin de l'entreprise
    await require_company_admin(company_id, current_user, session)
    
    repo = RecruiterRepository(session)
    recruiters = await repo.get_by_company_id(company_id)
    
    return [RecruiterResponse.model_validate(r) for r in recruiters]


@router.get("/me", response_model=RecruiterDetailResponse)
async def get_my_recruiter_profile(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère le profil recruteur de l'utilisateur connecté
    """
    repo = RecruiterRepository(session)
    recruiter = await repo.get_by_user_id(current_user.user_id)
    
    if not recruiter:
        raise RecruiterNotFoundError(str(current_user.user_id))
    
    # Récupérer les infos de l'entreprise
    company_repo = CompanyRepository(session)
    company = await company_repo.get_by_id(recruiter.company_id)
    
    response = RecruiterDetailResponse.model_validate(recruiter)
    response.company_name = company.name if company else None
    response.user_email = current_user.email
    
    return response


@router.delete("/{recruiter_id}", status_code=status.HTTP_200_OK)
async def remove_recruiter(
    recruiter_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Supprime un recruteur de l'entreprise (soft delete)
    
    Seul l'admin de l'entreprise peut supprimer un recruteur
    """
    repo = RecruiterRepository(session)
    recruiter = await repo.get_by_id(recruiter_id)
    
    if not recruiter:
        raise RecruiterNotFoundError(str(recruiter_id))
    
    # Vérifier que l'utilisateur est admin de l'entreprise
    await require_company_admin(recruiter.company_id, current_user, session)
    
    # Soft delete
    from datetime import datetime
    recruiter.deleted_at = datetime.utcnow()
    recruiter.status = "inactive"
    await repo.update(recruiter)
    
    return {"message": "Recruiter removed successfully"}


@router.post("/search/candidates", response_model=dict)
async def search_candidates(
    search_request: CandidateSearchRequest,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Recherche de candidats validés
    
    Accessible uniquement aux recruteurs et admins
    Les recruteurs ne peuvent voir que les candidats validés
    """
    # Vérifier les permissions
    if not can_view_validated_candidates(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters and admins can search candidates"
        )
    
    # Vérifier que l'utilisateur est recruteur actif
    recruiter_repo = RecruiterRepository(session)
    recruiter = await recruiter_repo.get_by_user_id(current_user.user_id)
    
    if not recruiter and "ROLE_SUPER_ADMIN" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be an active recruiter to search candidates"
        )
    
    # Appeler le service de recherche
    from app.core.config import settings
    search_url = f"{settings.SEARCH_SERVICE_URL}/api/v1/search"
    
    # Construire les paramètres de requête
    params = {
        "page": search_request.page,
        "size": search_request.size,
    }
    
    if search_request.query:
        params["query"] = search_request.query
    if search_request.sectors:
        params["sectors"] = ",".join(search_request.sectors)
    if search_request.main_jobs:
        params["main_jobs"] = ",".join(search_request.main_jobs)
    if search_request.min_experience is not None:
        params["min_experience"] = search_request.min_experience
    if search_request.max_experience is not None:
        params["max_experience"] = search_request.max_experience
    if search_request.min_admin_score is not None:
        params["min_admin_score"] = search_request.min_admin_score
    if search_request.skills:
        params["skills"] = ",".join(search_request.skills)
    
    # Appel au service de recherche
    async with httpx.AsyncClient() as client:
        response = await client.get(search_url, params=params)
        response.raise_for_status()
        return response.json()

