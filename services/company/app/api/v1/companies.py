"""
Endpoints de gestion des entreprises
"""
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.domain.schemas import (
    CompanyCreate,
    CompanyUpdate,
    CompanyResponse,
    CompanyDetailResponse,
)
from app.domain.models import Company, Recruiter
from app.domain.exceptions import CompanyNotFoundError
from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, TokenData
from app.infrastructure.permissions import require_company_admin, require_company_master
from app.infrastructure.repositories import CompanyRepository, RecruiterRepository

router = APIRouter()


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreate,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Crée une nouvelle entreprise
    
    Seuls les utilisateurs avec ROLE_COMPANY_ADMIN peuvent créer une entreprise
    """
    if "ROLE_COMPANY_ADMIN" not in current_user.roles and "ROLE_SUPER_ADMIN" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company admins can create companies"
        )
    
    # Vérifier que le legal_id n'existe pas déjà
    repo = CompanyRepository(session)
    existing = await repo.get_by_legal_id(company_data.legal_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Company with this legal ID already exists"
        )
    
    # Créer l'entreprise
    company = Company(
        name=company_data.name,
        legal_id=company_data.legal_id,
        logo_url=company_data.logo_url,
        admin_id=company_data.admin_id,
    )
    
    company = await repo.create(company)
    return CompanyResponse.model_validate(company)


@router.get("/{company_id}", response_model=CompanyDetailResponse)
async def get_company(
    company_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère une entreprise par ID
    
    Accessible par :
    - L'admin de l'entreprise
    - Les recruteurs de l'entreprise
    - Les super admins
    """
    repo = CompanyRepository(session)
    company = await repo.get_by_id(company_id)
    
    if not company:
        raise CompanyNotFoundError(str(company_id))
    
    # Vérifier les permissions
    is_admin = company.admin_id == current_user.user_id
    is_super_admin = "ROLE_SUPER_ADMIN" in current_user.roles
    
    if not is_admin and not is_super_admin:
        # Vérifier si l'utilisateur est recruteur de cette entreprise
        recruiter_repo = RecruiterRepository(session)
        recruiter = await recruiter_repo.get_by_user_id(current_user.user_id)
        if not recruiter or recruiter.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this company"
            )
    
    # Compter les recruteurs
    recruiter_repo = RecruiterRepository(session)
    recruiters = await recruiter_repo.get_by_company_id(company_id)
    active_recruiters = [r for r in recruiters if r.status == "active"]
    
    response = CompanyDetailResponse.model_validate(company)
    response.recruiters_count = len(recruiters)
    response.active_recruiters_count = len(active_recruiters)
    
    return response


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: int,
    company_data: CompanyUpdate,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Met à jour une entreprise
    
    Seul l'admin de l'entreprise peut la modifier
    """
    company = await require_company_admin(company_id, current_user, session)
    
    repo = CompanyRepository(session)
    
    # Mettre à jour les champs
    if company_data.name is not None:
        company.name = company_data.name
    if company_data.logo_url is not None:
        company.logo_url = company_data.logo_url
    if company_data.status is not None:
        company.status = company_data.status
    
    company = await repo.update(company)
    return CompanyResponse.model_validate(company)


@router.get("/me/company", response_model=CompanyResponse)
async def get_my_company(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère l'entreprise de l'utilisateur connecté
    """
    repo = CompanyRepository(session)
    company = await repo.get_by_admin_id(current_user.user_id)
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a company"
        )
    
    return CompanyResponse.model_validate(company)

