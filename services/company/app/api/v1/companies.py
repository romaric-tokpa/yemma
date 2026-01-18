"""
Endpoints de gestion des entreprises
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.domain.schemas import (
    CompanyCreate,
    CompanyUpdate,
    CompanyResponse,
    CompanyDetailResponse,
    RecruiterResponse,
)
from app.domain.models import Company, TeamMember
from app.core.exceptions import CompanyNotFoundError
from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, TokenData
from app.infrastructure.permissions import require_company_admin, require_company_master
from app.infrastructure.repositories import CompanyRepository, TeamMemberRepository

logger = logging.getLogger(__name__)
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
        # Vérifier si l'utilisateur est membre de cette entreprise
        team_member_repo = TeamMemberRepository(session)
        team_member = await team_member_repo.get_by_user_id(current_user.user_id)
        if not team_member or team_member.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this company"
            )
    
    # Compter les membres d'équipe
    team_member_repo = TeamMemberRepository(session)
    team_members = await team_member_repo.get_by_company_id(company_id)
    active_team_members = [m for m in team_members if m.status == "active"]
    
    response = CompanyDetailResponse.model_validate(company)
    response.team_members_count = len(team_members)
    response.active_team_members_count = len(active_team_members)
    
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
    if company_data.adresse is not None:
        company.adresse = company_data.adresse
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
    try:
        logger.info(f"get_my_company called for user_id={current_user.user_id}, email={current_user.email}")
        repo = CompanyRepository(session)
        company = await repo.get_by_admin_id(current_user.user_id)
        
        if not company:
            logger.info(f"No company found for user_id={current_user.user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="You don't have a company"
            )
        
        logger.info(f"Company found: id={company.id}, name={company.name}")
        return CompanyResponse.model_validate(company)
    except HTTPException:
        # Re-raise HTTP exceptions (comme 404)
        raise
    except Exception as e:
        # Logger l'erreur pour le débogage
        logger.error(f"Error in get_my_company for user_id={current_user.user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/{company_id}/team-members", response_model=List[RecruiterResponse])
async def get_company_team_members(
    company_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère tous les membres de l'équipe d'une entreprise
    
    Accessible par :
    - L'admin de l'entreprise
    - Les super admins
    """
    # Vérifier que l'utilisateur est admin de l'entreprise
    await require_company_admin(company_id, current_user, session)
    
    team_member_repo = TeamMemberRepository(session)
    team_members = await team_member_repo.get_by_company_id(company_id)
    
    return [RecruiterResponse.model_validate(tm) for tm in team_members]

