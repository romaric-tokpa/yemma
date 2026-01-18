"""
Endpoints de gestion des invitations
"""
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.domain.schemas import (
    InvitationCreate,
    InvitationResponse,
    InvitationAcceptRequest,
)
from app.domain.models import Invitation, InvitationStatus, TeamMember, TeamMemberStatus, TeamMemberRole
from app.core.exceptions import InvitationError
from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, TokenData
from app.infrastructure.repositories import InvitationRepository, TeamMemberRepository, CompanyRepository
from app.infrastructure.invitation import (
    create_invitation_token,
    is_invitation_valid,
    get_invitation_link,
)
from app.infrastructure.notification_client import send_invitation_notification
from app.core.config import settings
import httpx

router = APIRouter()


@router.post("/invite", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def invite_recruiter(
    invitation_data: InvitationCreate,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Envoie une invitation à un recruteur
    
    Uniquement accessible par ROLE_COMPANY_ADMIN.
    Génère un token unique et appelle le Service Notification pour envoyer l'email.
    """
    # Vérifier que l'utilisateur a le rôle ROLE_COMPANY_ADMIN
    if "ROLE_COMPANY_ADMIN" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company admin (ROLE_COMPANY_ADMIN) can invite recruiters"
        )
    
    # Récupérer l'entreprise de l'utilisateur via get_current_company et vérifier le rôle
    from app.infrastructure.company_middleware import get_current_company, get_current_team_member
    company = await get_current_company(current_user, session)
    team_member = await get_current_team_member(current_user, session)
    
    # Vérifier que le rôle est ADMIN_ENTREPRISE
    if team_member.role_in_company != "ADMIN_ENTREPRISE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company admin can perform this action"
        )
    
    # Vérifier qu'il n'y a pas déjà une invitation en cours pour cet email
    invitation_repo = InvitationRepository(session)
    existing_invitation = await invitation_repo.get_by_email_and_company(
        invitation_data.email,
        company.id
    )
    
    if existing_invitation and is_invitation_valid(existing_invitation):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active invitation already exists for this email"
        )
    
    # Vérifier que l'utilisateur n'est pas déjà membre de cette entreprise
    # Vérifier via auth-service si l'utilisateur existe
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/v1/users/email/{invitation_data.email}"
            )
            if response.status_code == 200:
                user_data = response.json()
                user_id = user_data.get("id")
                
                # Vérifier si cet utilisateur est déjà membre de l'entreprise
                team_member_repo = TeamMemberRepository(session)
                existing_member = await team_member_repo.get_by_user_id(user_id)
                if existing_member and existing_member.company_id == company.id:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="This user is already a team member of your company"
                    )
    except httpx.HTTPStatusError:
        # L'utilisateur n'existe pas encore, c'est OK (il sera créé lors de l'acceptation)
        pass
    except httpx.HTTPError:
        # Erreur de connexion, on continue quand même
        pass
    
    # Générer le token d'invitation unique
    token, expires_at = create_invitation_token(
        invitation_data.email,
        company.id
    )
    
    # Créer l'invitation avec le rôle RECRUTEUR par défaut
    invitation = Invitation(
        company_id=company.id,
        email=invitation_data.email,
        token=token,
        role=TeamMemberRole.RECRUTEUR,  # Rôle par défaut
        status=InvitationStatus.PENDING,
        expires_at=expires_at,
        invited_by=current_user.user_id,
    )
    
    invitation = await invitation_repo.create(invitation)
    
    # Appeler le Service Notification pour envoyer l'email
    invitation_url = f"{settings.FRONTEND_URL}/invitation/accept?token={token}"
    recipient_name = invitation_data.email.split("@")[0]  # Nom par défaut depuis l'email
    
    await send_invitation_notification(
        recipient_email=invitation_data.email,
        recipient_name=recipient_name,
        company_name=company.name,
        invitation_token=token,
        invitation_url=invitation_url
    )
    
    return InvitationResponse.model_validate(invitation)


@router.get("/company/{company_id}", response_model=List[InvitationResponse])
async def get_company_invitations(
    company_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère toutes les invitations d'une entreprise
    
    Seul l'admin de l'entreprise peut voir les invitations
    """
    # Vérifier que l'utilisateur est admin de l'entreprise
    from app.infrastructure.company_middleware import get_current_company, get_current_team_member
    company = await get_current_company(current_user, session)
    team_member = await get_current_team_member(current_user, session)
    
    # Vérifier que le rôle est ADMIN_ENTREPRISE
    if team_member.role_in_company != "ADMIN_ENTREPRISE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company admin can perform this action"
        )
    
    # Vérifier que l'entreprise correspond
    if company.id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this company"
        )
    
    invitation_repo = InvitationRepository(session)
    invitations = await invitation_repo.get_by_company_id(company_id)
    
    return [InvitationResponse.model_validate(inv) for inv in invitations]


@router.post("/accept-invite", status_code=status.HTTP_200_OK)
async def accept_invitation(
    accept_data: InvitationAcceptRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Accepte une invitation et crée le compte recruteur
    
    Cet endpoint peut être appelé sans authentification (token d'invitation suffit).
    Si l'utilisateur n'existe pas dans auth-service, il sera créé avec le mot de passe fourni.
    Le compte sera automatiquement lié à la Company et le rôle ROLE_RECRUITER sera assigné.
    """
    invitation_repo = InvitationRepository(session)
    invitation = await invitation_repo.get_by_token(accept_data.token)
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    if not is_invitation_valid(invitation):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation is expired or already used"
        )
    
    # Vérifier ou créer l'utilisateur dans auth-service
    user_id = None
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # Vérifier si l'utilisateur existe
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/v1/users/email/{invitation.email}"
            )
            
            if response.status_code == 200:
                # L'utilisateur existe déjà
                user_data = response.json()
                user_id = user_data["id"]
            elif response.status_code == 404:
                # L'utilisateur n'existe pas, le créer
                if not accept_data.password:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Password is required to create a new account"
                    )
                
                if not accept_data.first_name or not accept_data.last_name:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="First name and last name are required to create a new account"
                    )
                
                # Créer le compte avec le rôle ROLE_RECRUITER
                register_response = await client.post(
                    f"{settings.AUTH_SERVICE_URL}/api/v1/auth/register",
                    json={
                        "email": invitation.email,
                        "password": accept_data.password,
                        "first_name": accept_data.first_name,
                        "last_name": accept_data.last_name,
                        "role": "ROLE_RECRUITER"
                    }
                )
                register_response.raise_for_status()
                register_data = register_response.json()
                
                # Récupérer l'ID utilisateur depuis le token ou refaire une requête
                # Note: Le endpoint register ne retourne pas l'user_id, on doit le récupérer
                user_response = await client.get(
                    f"{settings.AUTH_SERVICE_URL}/api/v1/users/email/{invitation.email}"
                )
                user_response.raise_for_status()
                user_data = user_response.json()
                user_id = user_data["id"]
            else:
                response.raise_for_status()
                
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create or verify user account: {str(e)}"
            )
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to connect to auth service: {str(e)}"
            )
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user ID"
        )
    
    # Vérifier que le team member n'existe pas déjà
    team_member_repo = TeamMemberRepository(session)
    existing_member = await team_member_repo.get_by_user_id(user_id)
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a team member of a company"
        )
    
    # Créer le team member avec le rôle de l'invitation
    team_member = TeamMember(
        user_id=user_id,
        company_id=invitation.company_id,
        role_in_company=invitation.role,  # Utiliser le rôle de l'invitation
        status=TeamMemberStatus.ACTIVE,
        joined_at=datetime.utcnow(),
    )
    
    team_member = await team_member_repo.create(team_member)
    
    # Marquer l'invitation comme acceptée
    invitation.status = InvitationStatus.ACCEPTED
    invitation.accepted_at = datetime.utcnow()
    await invitation_repo.update(invitation)
    
    return {
        "message": "Invitation accepted successfully",
        "team_member_id": team_member.id,
        "company_id": team_member.company_id,
        "role": team_member.role_in_company,
        "user_id": user_id,
    }


@router.get("/validate/{token}", response_model=InvitationResponse)
async def validate_invitation_token(
    token: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Valide un token d'invitation (pour vérifier avant affichage du formulaire)
    """
    invitation_repo = InvitationRepository(session)
    invitation = await invitation_repo.get_by_token(token)
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    if not is_invitation_valid(invitation):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation is expired or already used"
        )
    
    # Récupérer les infos de l'entreprise
    company_repo = CompanyRepository(session)
    company = await company_repo.get_by_id(invitation.company_id)
    
    response = InvitationResponse.model_validate(invitation)
    return response

