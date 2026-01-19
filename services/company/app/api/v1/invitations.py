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
import logging

logger = logging.getLogger(__name__)
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
    
    # Récupérer l'entreprise de l'utilisateur
    # Vérifier d'abord si l'utilisateur est l'admin de l'entreprise (via company.admin_id)
    # Sinon, vérifier s'il est membre avec le rôle ADMIN_ENTREPRISE
    from app.infrastructure.company_middleware import get_current_company, get_current_team_member
    from app.infrastructure.repositories import CompanyRepository
    
    company_repo = CompanyRepository(session)
    company = await company_repo.get_by_admin_id(current_user.user_id)
    
    # Si l'utilisateur n'est pas l'admin direct de l'entreprise, vérifier s'il est membre avec le rôle ADMIN_ENTREPRISE
    if not company:
        try:
            # Récupérer l'entreprise via team_member
            company = await get_current_company(current_user, session)
            team_member = await get_current_team_member(current_user, session)
            
            # Vérifier que le rôle est ADMIN_ENTREPRISE
            if team_member.role_in_company != "ADMIN_ENTREPRISE":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only company admin can perform this action"
                )
        except HTTPException:
            # Re-lever les HTTPException telles quelles
            raise
        except Exception:
            # Pour toute autre exception, refuser l'accès
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only company admin can perform this action"
            )
    
    # Vérifier s'il y a déjà une invitation en cours pour cet email
    invitation_repo = InvitationRepository(session)
    existing_invitation = await invitation_repo.get_by_email_and_company(
        invitation_data.email,
        company.id
    )
    
    # Si une invitation valide existe déjà, annuler l'ancienne et créer une nouvelle
    if existing_invitation and is_invitation_valid(existing_invitation):
        # Annuler l'ancienne invitation pour permettre d'en envoyer une nouvelle
        existing_invitation.status = InvitationStatus.CANCELLED
        await invitation_repo.update(existing_invitation)
    
    # Vérifier que l'utilisateur n'est pas déjà membre de cette entreprise
    # Vérifier via auth-service si l'utilisateur existe
    user_exists = False
    user_id = None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/v1/users/email/{invitation_data.email}"
            )
            if response.status_code == 200:
                user_data = response.json()
                user_id = user_data.get("id")
                user_exists = True
                
                # Vérifier si cet utilisateur est déjà membre de l'entreprise
                team_member_repo = TeamMemberRepository(session)
                existing_member = await team_member_repo.get_by_user_id(user_id)
                if existing_member and existing_member.company_id == company.id:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="This user is already a team member of your company"
                    )
    except httpx.HTTPStatusError as e:
        # L'utilisateur n'existe pas encore (404), on va le créer
        if e.response.status_code != 404:
            raise
        user_exists = False
    except httpx.HTTPError:
        # Erreur de connexion, on continue quand même
        pass
    
    # Générer le token d'invitation unique
    token, expires_at = create_invitation_token(
        invitation_data.email,
        company.id
    )
    
    # Créer l'invitation avec le rôle RECRUTEUR par défaut
    # Le compte ne sera créé que lorsque l'invité acceptera l'invitation
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
    # Le lien pointe vers la page d'acceptation d'invitation où l'utilisateur créera son compte
    invitation_url = f"{settings.FRONTEND_URL}/invitation/accept?token={token}"
    recipient_name = invitation_data.email.split("@")[0]  # Nom par défaut depuis l'email
    
    try:
        await send_invitation_notification(
            recipient_email=invitation_data.email,
            recipient_name=recipient_name,
            company_name=company.name,
            invitation_token=token,
            invitation_url=invitation_url,
            temporary_password=None  # Plus de mot de passe temporaire, l'utilisateur créera le sien
        )
    except Exception as e:
        # Log l'erreur mais ne pas bloquer la création de l'invitation
        # L'invitation a été créée, on peut toujours la retourner
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error sending invitation notification: {str(e)}", exc_info=True)
        # On continue quand même car l'invitation a été créée
        # L'utilisateur pourra voir l'invitation dans la liste même si l'email n'a pas été envoyé
    
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
    try:
        logger.info(f"Accepting invitation with token: {accept_data.token[:20]}...")
        invitation_repo = InvitationRepository(session)
        invitation = await invitation_repo.get_by_token(accept_data.token)
        
        if not invitation:
            logger.warning(f"Invitation not found for token: {accept_data.token[:20]}...")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found"
            )
        
        if not is_invitation_valid(invitation):
            logger.warning(f"Invitation is invalid or expired: {invitation.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation is expired or already used"
            )
        
        logger.info(f"Invitation found: {invitation.id}, email: {invitation.email}")
        
        # Vérifier ou créer l'utilisateur dans auth-service
        user_id = None
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # Essayer de créer l'utilisateur directement
                # Si l'utilisateur existe déjà (409), on utilisera le login pour obtenir l'ID
                logger.info(f"Attempting to create user: {invitation.email}")
                register_url = f"{settings.AUTH_SERVICE_URL}/api/v1/auth/register"
                logger.info(f"Register URL: {register_url}")
                register_response = await client.post(
                    register_url,
                    json={
                        "email": invitation.email,
                        "password": accept_data.password,
                        "first_name": accept_data.first_name,
                        "last_name": accept_data.last_name,
                        "role": "ROLE_RECRUITER"
                    }
                )
                
                if register_response.status_code in [200, 201]:
                    # Utilisateur créé avec succès
                    register_data = register_response.json()
                    logger.info(f"User registered successfully: {register_data}")
                    
                    # Récupérer l'ID utilisateur depuis le token
                    # Le token contient l'ID utilisateur dans le champ 'sub'
                    access_token = register_data.get("access_token")
                    if access_token:
                        try:
                            # Note: On doit utiliser la même clé secrète que le service auth
                            # Pour l'instant, on va utiliser l'endpoint /me avec le token
                            logger.info(f"Fetching user ID from token")
                            me_url = f"{settings.AUTH_SERVICE_URL}/api/v1/users/me"
                            me_response = await client.get(
                                me_url,
                                headers={"Authorization": f"Bearer {access_token}"}
                            )
                            if me_response.status_code == 200:
                                user_data = me_response.json()
                                user_id = user_data.get("id")
                                if not user_id:
                                    logger.error(f"User ID not found in /me response: {user_data}")
                                    raise HTTPException(
                                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                        detail="User ID not found in /me response"
                                    )
                                logger.info(f"User ID retrieved from /me endpoint: {user_id}")
                            elif me_response.status_code == 401:
                                error_detail = me_response.text
                                logger.error(f"Unauthorized when accessing /me: {error_detail}")
                                raise HTTPException(
                                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                    detail=f"Token invalide lors de la récupération de l'ID utilisateur: {error_detail}"
                                )
                            else:
                                error_detail = me_response.text
                                logger.error(f"Failed to get user from /me: {me_response.status_code} - {error_detail}")
                                raise HTTPException(
                                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                    detail=f"Échec de la récupération de l'ID utilisateur après l'enregistrement: {error_detail}"
                                )
                        except Exception as e:
                            logger.error(f"Error getting user from /me: {str(e)}")
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"Failed to retrieve user ID after registration: {str(e)}"
                            )
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="No access token in registration response"
                        )
                elif register_response.status_code == 409:
                    # L'utilisateur existe déjà
                    # On essaie de se connecter avec le mot de passe fourni pour vérifier s'il correspond
                    # Si oui, on lie le compte à l'entreprise. Si non, on retourne une erreur claire.
                    logger.info(f"User already exists (409), verifying password: {invitation.email}")
                    login_url = f"{settings.AUTH_SERVICE_URL}/api/v1/auth/login"
                    login_response = await client.post(
                        login_url,
                        json={
                            "email": invitation.email,
                            "password": accept_data.password
                        }
                    )
                    
                    if login_response.status_code == 200:
                        # Le mot de passe est correct, on peut lier le compte à l'entreprise
                        login_data = login_response.json()
                        access_token = login_data.get("access_token")
                        if access_token:
                            # Récupérer l'ID utilisateur via l'endpoint /me
                            try:
                                me_url = f"{settings.AUTH_SERVICE_URL}/api/v1/users/me"
                                me_response = await client.get(
                                    me_url,
                                    headers={"Authorization": f"Bearer {access_token}"}
                                )
                                if me_response.status_code == 200:
                                    user_data = me_response.json()
                                    user_id = user_data.get("id")
                                    if not user_id:
                                        raise HTTPException(
                                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                            detail="User ID not found in /me response"
                                        )
                                    logger.info(f"User ID retrieved from /me endpoint after login: {user_id}")
                                elif me_response.status_code == 401:
                                    error_detail = me_response.text
                                    logger.error(f"Unauthorized when accessing /me after login: {error_detail}")
                                    raise HTTPException(
                                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                        detail=f"Token invalide lors de la récupération de l'ID utilisateur après connexion: {error_detail}"
                                    )
                                else:
                                    error_detail = me_response.text
                                    logger.error(f"Failed to get user from /me after login: {me_response.status_code} - {error_detail}")
                                    raise HTTPException(
                                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                        detail=f"Échec de la récupération de l'ID utilisateur après connexion: {error_detail}"
                                    )
                            except HTTPException:
                                raise
                            except Exception as e:
                                logger.error(f"Error getting user from /me: {str(e)}")
                                raise HTTPException(
                                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                    detail=f"Failed to retrieve user ID from login: {str(e)}"
                                )
                        else:
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="No access token in login response"
                            )
                    elif login_response.status_code == 401:
                        # Mot de passe incorrect - l'utilisateur existe mais le mot de passe ne correspond pas
                        error_detail = login_response.text
                        logger.error(f"Failed to login existing user: Invalid password - {error_detail}")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Un compte existe déjà avec cet email. Pour accepter cette invitation, vous devez utiliser le mot de passe de votre compte existant. Si vous avez oublié votre mot de passe, veuillez utiliser la fonctionnalité de réinitialisation de mot de passe."
                        )
                    else:
                        error_detail = login_response.text
                        logger.error(f"Failed to login existing user: {login_response.status_code} - {error_detail}")
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Impossible de se connecter avec le compte existant. Le compte peut être inactif: {error_detail}"
                        )
                else:
                    error_detail = register_response.text
                    logger.error(f"Failed to register user: {register_response.status_code} - {error_detail}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to create user account: {error_detail}"
                    )
                    
            except httpx.HTTPStatusError as e:
                error_detail = e.response.text if e.response else str(e)
                logger.error(f"HTTP error when communicating with auth service: {e}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create or verify user account: {error_detail}"
                )
            except httpx.HTTPError as e:
                logger.error(f"Connection error when communicating with auth service: {e}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to connect to auth service: {str(e)}"
                )
            except Exception as e:
                logger.error(f"Unexpected error when communicating with auth service: {e}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Unexpected error: {str(e)}"
                )
        
        if not user_id:
            logger.error("User ID is None after all attempts")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get user ID"
            )
        
        logger.info(f"User ID confirmed: {user_id}")
        
        # Vérifier si le team member existe déjà
        team_member_repo = TeamMemberRepository(session)
        existing_member = await team_member_repo.get_by_user_id(user_id)
        
        if existing_member:
            logger.info(f"Team member already exists: {existing_member.id}")
            # Si le TeamMember existe déjà pour cette entreprise, simplement mettre à jour le statut
            if existing_member.company_id == invitation.company_id:
                # Mettre à jour le statut à ACTIVE et la date de jointure
                existing_member.status = TeamMemberStatus.ACTIVE
                if not existing_member.joined_at:
                    existing_member.joined_at = datetime.utcnow()
                team_member = await team_member_repo.update(existing_member)
                logger.info(f"Team member updated: {team_member.id}")
            else:
                # L'utilisateur est déjà membre d'une autre entreprise
                logger.warning(f"User {user_id} is already a member of company {existing_member.company_id}, not {invitation.company_id}")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User is already a team member of another company"
                )
        else:
            # Créer le team member avec le rôle de l'invitation
            logger.info(f"Creating new team member for user {user_id}, company {invitation.company_id}, role {invitation.role}")
            team_member = TeamMember(
                user_id=user_id,
                company_id=invitation.company_id,
                role_in_company=invitation.role,  # Utiliser le rôle de l'invitation
                status=TeamMemberStatus.ACTIVE,
                joined_at=datetime.utcnow(),
            )
            
            team_member = await team_member_repo.create(team_member)
            logger.info(f"Team member created: {team_member.id}")
        
        # Marquer l'invitation comme acceptée
        logger.info(f"Marking invitation {invitation.id} as accepted")
        invitation.status = InvitationStatus.ACCEPTED
        invitation.accepted_at = datetime.utcnow()
        await invitation_repo.update(invitation)
        
        logger.info(f"Invitation accepted successfully for user {user_id}")
        return {
            "message": "Invitation accepted successfully",
            "team_member_id": team_member.id,
            "company_id": team_member.company_id,
            "role": team_member.role_in_company,
            "user_id": user_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in accept_invitation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


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

