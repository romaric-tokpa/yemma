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
    TeamMemberOrInvitationResponse,
)
from app.domain.models import Company, TeamMember, Invitation, InvitationStatus, TeamMemberStatus
from app.infrastructure.repositories import InvitationRepository
from app.core.exceptions import CompanyNotFoundError
from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, TokenData
from app.infrastructure.permissions import require_company_admin, require_company_master
from app.infrastructure.repositories import CompanyRepository, TeamMemberRepository
from app.core.config import settings

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
    
    # Envoyer l'email de bienvenue après création réussie
    try:
        from app.infrastructure.notification_client import send_company_welcome_notification
        from app.core.config import settings
        
        # Construire le nom du recruteur (utiliser l'email comme fallback)
        recipient_name = current_user.email.split('@')[0]  # Nom d'utilisateur par défaut
        
        # Envoyer l'email de bienvenue (ne bloque pas si ça échoue)
        await send_company_welcome_notification(
            recipient_email=current_user.email,
            recipient_name=recipient_name,
            company_name=company.name,
            dashboard_url=f"{settings.FRONTEND_URL}/company/dashboard"
        )
    except Exception as email_error:
        # Logger l'erreur mais ne pas bloquer la création
        logger.warning(f"Failed to send welcome email to company {company.name}: {str(email_error)}")
    
    return CompanyResponse.model_validate(company)


@router.get("", response_model=List[CompanyResponse])
async def list_companies(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Liste toutes les entreprises (réservé aux super admins et admins)
    
    Permet aux administrateurs de voir toutes les entreprises inscrites.
    """
    # Vérifier que c'est un super admin ou admin
    user_roles = current_user.roles if isinstance(current_user.roles, list) else []
    if "ROLE_SUPER_ADMIN" not in user_roles and "ROLE_ADMIN" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can list all companies"
        )
    
    # Récupérer toutes les entreprises non supprimées
    repo = CompanyRepository(session)
    statement = select(Company).where(Company.deleted_at.is_(None)).order_by(Company.created_at.desc())
    result = await session.execute(statement)
    companies = result.scalars().all()
    
    return [CompanyResponse.model_validate(company) for company in companies]


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


@router.get("", response_model=List[CompanyResponse])
async def list_companies(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Liste toutes les entreprises (réservé aux super admins)
    
    Permet aux administrateurs de voir toutes les entreprises inscrites.
    """
    # Vérifier que c'est un super admin
    user_roles = current_user.roles if isinstance(current_user.roles, list) else []
    if "ROLE_SUPER_ADMIN" not in user_roles and "ROLE_ADMIN" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can list all companies"
        )
    
    # Récupérer toutes les entreprises non supprimées
    repo = CompanyRepository(session)
    statement = select(Company).where(Company.deleted_at.is_(None)).order_by(Company.created_at.desc())
    result = await session.execute(statement)
    companies = result.scalars().all()
    
    return [CompanyResponse.model_validate(company) for company in companies]


@router.get("/me/company", response_model=CompanyResponse)
async def get_my_company(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère l'entreprise de l'utilisateur connecté
    Fonctionne pour les admins d'entreprise et les recruteurs
    """
    try:
        logger.info(f"get_my_company called for user_id={current_user.user_id}, email={current_user.email}, roles={current_user.roles}")
        repo = CompanyRepository(session)
        
        # D'abord, essayer de trouver l'entreprise où l'utilisateur est admin
        company = await repo.get_by_admin_id(current_user.user_id)
        logger.info(f"Company found as admin: {company.id if company else None}")
        
        # Si pas trouvé, chercher via TeamMember (pour les recruteurs ou autres membres)
        if not company:
            logger.info(f"No company found as admin, checking TeamMember for user_id={current_user.user_id}")
            team_member_repo = TeamMemberRepository(session)
            team_member = await team_member_repo.get_by_user_id(current_user.user_id)
            
            if team_member:
                logger.info(f"TeamMember found: id={team_member.id}, company_id={team_member.company_id}, status={team_member.status}")
                if team_member.company_id:
                    company = await repo.get_by_id(team_member.company_id)
                    logger.info(f"Company found via TeamMember: id={company.id if company else None}, name={company.name if company else None}")
                else:
                    logger.warning(f"TeamMember found but company_id is None for user_id={current_user.user_id}")
            else:
                logger.info(f"No TeamMember found for user_id={current_user.user_id}")
        
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
        logger.error(f"Error in get_my_company for user_id={current_user.user_id}: {str(e)}", exc_info=True, stack_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/{company_id}/team-members", response_model=List[TeamMemberOrInvitationResponse])
async def get_company_team_members(
    company_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère tous les membres de l'équipe d'une entreprise, y compris les invitations en attente
    
    Accessible par :
    - L'admin de l'entreprise
    - Les super admins
    """
    import httpx
    
    # Vérifier que l'utilisateur est admin de l'entreprise
    await require_company_admin(company_id, current_user, session)
    
    team_member_repo = TeamMemberRepository(session)
    team_members = await team_member_repo.get_by_company_id(company_id)
    
    # Récupérer aussi les invitations en attente
    invitation_repo = InvitationRepository(session)
    pending_invitations = await invitation_repo.get_by_company_id(company_id)
    # Filtrer seulement les invitations PENDING
    pending_invitations = [inv for inv in pending_invitations if inv.status == InvitationStatus.PENDING]
    
    result = []
    
    # Ajouter les TeamMember
    for tm in team_members:
        # Récupérer les informations de l'utilisateur depuis auth-service si possible
        user_email = None
        user_first_name = None
        user_last_name = None
        try:
            # Utiliser l'endpoint interne avec token de service
            import sys
            import os
            shared_path = "/shared"
            if os.path.exists(shared_path) and shared_path not in sys.path:
                sys.path.insert(0, shared_path)
            
            try:
                from shared.internal_auth import get_service_token_header
            except ImportError:
                # Fallback: utiliser depuis notification_client
                from app.infrastructure.notification_client import get_service_token_header
            
            headers = get_service_token_header("company-service")
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{settings.AUTH_SERVICE_URL}/api/v1/users/internal/{tm.user_id}",
                    headers=headers
                )
                if response.status_code == 200:
                    user_data = response.json()
                    user_email = user_data.get("email")
                    user_first_name = user_data.get("first_name")
                    user_last_name = user_data.get("last_name")
                    logger.info(f"Successfully fetched user data for user_id={tm.user_id}: {user_first_name} {user_last_name}")
                else:
                    logger.warning(f"Failed to fetch user data for user_id={tm.user_id}: HTTP {response.status_code} - {response.text}")
        except Exception as e:
            logger.warning(f"Failed to fetch user data for user_id={tm.user_id}: {str(e)}", exc_info=True)
        
        result.append(TeamMemberOrInvitationResponse(
            id=tm.id,
            type="member",
            email=user_email or f"user_{tm.user_id}",
            first_name=user_first_name,
            last_name=user_last_name,
            role_in_company=tm.role_in_company,
            status=tm.status.value if hasattr(tm.status, 'value') else str(tm.status),
            joined_at=tm.joined_at,
            created_at=tm.created_at,
            updated_at=tm.updated_at,
            user_id=tm.user_id,
            invitation_id=None,
            expires_at=None
        ))
    
    # Ajouter les invitations en attente
    for inv in pending_invitations:
        # Pour les invitations, récupérer first_name et last_name depuis le modèle Invitation
        # Ces informations sont maintenant stockées lors de la création de l'invitation
        result.append(TeamMemberOrInvitationResponse(
            id=inv.id,
            type="invitation",
            email=inv.email,
            first_name=inv.first_name,  # Récupéré depuis le modèle Invitation
            last_name=inv.last_name,     # Récupéré depuis le modèle Invitation
            role_in_company=inv.role,
            status="pending",
            joined_at=None,
            created_at=inv.created_at,
            updated_at=None,
            user_id=None,
            invitation_id=inv.id,
            expires_at=inv.expires_at
        ))
    
    # Trier par date de création (les plus récents en premier)
    result.sort(key=lambda x: x.created_at, reverse=True)
    
    return result


@router.delete("/{company_id}/team-members/{team_member_id}", status_code=status.HTTP_200_OK)
async def delete_team_member(
    company_id: int,
    team_member_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Supprime un membre d'équipe de l'entreprise (soft delete)
    
    Seul l'admin de l'entreprise peut supprimer un membre d'équipe.
    L'administrateur de l'entreprise ne peut pas être supprimé.
    """
    logger.info(f"DELETE team member request: company_id={company_id}, team_member_id={team_member_id}, user_id={current_user.user_id}")
    
    # Vérifier que l'utilisateur est admin de l'entreprise et récupérer l'entreprise
    company = await require_company_admin(company_id, current_user, session)
    
    # Récupérer le membre d'équipe
    team_member_repo = TeamMemberRepository(session)
    team_member = await team_member_repo.get_by_id(team_member_id)
    
    if not team_member:
        logger.warning(f"Team member not found: team_member_id={team_member_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membre d'équipe non trouvé"
        )
    
    logger.info(f"Team member found: id={team_member.id}, user_id={team_member.user_id}, company_id={team_member.company_id}, company.admin_id={company.admin_id}")
    
    # Vérifier que le membre d'équipe appartient à cette entreprise
    if team_member.company_id != company_id:
        logger.warning(f"Team member {team_member_id} does not belong to company {company_id} (belongs to {team_member.company_id})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce membre d'équipe n'appartient pas à cette entreprise"
        )
    
    # Vérifier qu'on ne supprime pas l'admin de l'entreprise
    if company.admin_id == team_member.user_id:
        logger.warning(f"Attempt to delete company admin: company_id={company_id}, admin_user_id={company.admin_id}, team_member_user_id={team_member.user_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de supprimer l'administrateur de l'entreprise. Vous devez d'abord transférer l'administration à un autre membre."
        )
    
    # Soft delete
    logger.info(f"Deleting team member {team_member_id} (user_id={team_member.user_id}) from company {company_id}")
    await team_member_repo.delete(team_member)
    
    return {"message": "Membre d'équipe supprimé avec succès"}

