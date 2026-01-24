"""
Endpoints de gestion des invitations
"""
from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

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
    generate_invitation_token,
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
    
    # Vérifier si l'utilisateur est déjà membre de cette entreprise
    from app.infrastructure.repositories import TeamMemberRepository
    team_member_repo = TeamMemberRepository(session)
    
    # Créer directement le compte dans auth-service
    user_id = None
    password_reset_token = None
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # Créer l'utilisateur dans auth-service
            logger.info(f"Creating user account for: {invitation_data.email}")
            register_url = f"{settings.AUTH_SERVICE_URL}/api/v1/auth/register"
            register_response = await client.post(
                register_url,
                json={
                    "email": invitation_data.email,
                    "password": invitation_data.password,
                    "first_name": invitation_data.first_name,
                    "last_name": invitation_data.last_name,
                    "role": "ROLE_RECRUITER"
                }
            )
            
            if register_response.status_code in [200, 201]:
                # Utilisateur créé avec succès
                register_data = register_response.json()
                access_token = register_data.get("access_token")
                
                # Extraire l'ID utilisateur directement depuis le token JWT
                # Le token contient 'sub' qui est l'ID utilisateur
                if access_token:
                    try:
                        from app.infrastructure.auth import decode_token
                        # Décoder le token pour extraire l'ID utilisateur
                        decoded_token = decode_token(access_token)
                        user_id = int(decoded_token.get("sub"))
                        logger.info(f"User created successfully with ID: {user_id} (extracted from token)")
                    except HTTPException:
                        raise
                    except Exception as e:
                        logger.error(f"Failed to extract user ID from token: {str(e)}", exc_info=True)
                        # Fallback: essayer de récupérer via l'endpoint /me
                        try:
                            me_url = f"{settings.AUTH_SERVICE_URL}/api/v1/users/me"
                            me_response = await client.get(
                                me_url,
                                headers={"Authorization": f"Bearer {access_token}"}
                            )
                            if me_response.status_code == 200:
                                user_data = me_response.json()
                                user_id = user_data.get("id")
                                logger.info(f"User ID retrieved via /me endpoint: {user_id}")
                            else:
                                error_detail = me_response.text
                                logger.error(f"Failed to get user ID after registration: {me_response.status_code} - {error_detail}")
                                raise HTTPException(
                                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                    detail=f"Échec de la récupération de l'ID utilisateur: {error_detail}"
                                )
                        except Exception as fallback_error:
                            logger.error(f"Fallback to /me endpoint also failed: {str(fallback_error)}")
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"Échec de l'extraction de l'ID utilisateur: {str(e)}"
                            )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Token d'accès non reçu lors de la création du compte"
                    )
                
                # Générer un token de réinitialisation de mot de passe
                logger.info(f"Generating password reset token for user: {user_id}")
                reset_token_url = f"{settings.AUTH_SERVICE_URL}/api/v1/auth/generate-password-reset-token"
                try:
                    reset_token_response = await client.post(
                        reset_token_url,
                        json={
                            "email": invitation_data.email,
                            "internal_token": settings.INTERNAL_SERVICE_TOKEN_SECRET
                        }
                    )
                    
                    if reset_token_response.status_code == 200:
                        reset_token_data = reset_token_response.json()
                        password_reset_token = reset_token_data.get("reset_token")
                        logger.info(f"Password reset token generated successfully")
                    else:
                        error_detail = reset_token_response.text
                        logger.warning(f"Failed to generate password reset token: {reset_token_response.status_code} - {error_detail}")
                        # On continue quand même, on pourra générer le token plus tard
                except Exception as e:
                    logger.warning(f"Error generating password reset token: {str(e)}")
                    # On continue quand même
                    
            elif register_response.status_code == 409:
                # L'utilisateur existe déjà, récupérer son ID et mettre à jour le mot de passe si nécessaire
                logger.info(f"User already exists (409), will retrieve user ID and handle password: {invitation_data.email}")
                
                # D'abord, vérifier si l'utilisateur est déjà membre de cette entreprise
                # Pour cela, on doit récupérer son user_id
                # Essayer de se connecter pour obtenir un token et récupérer l'ID
                login_url = f"{settings.AUTH_SERVICE_URL}/api/v1/auth/login"
                logger.info(f"Attempting to login with provided password for existing user: {invitation_data.email}")
                login_response = await client.post(
                    login_url,
                    json={
                        "email": invitation_data.email,
                        "password": invitation_data.password
                    }
                )
                logger.info(f"Login response status: {login_response.status_code}")
                
                if login_response.status_code == 200:
                    # Le mot de passe correspond déjà, récupérer l'ID utilisateur
                    login_data = login_response.json()
                    access_token = login_data.get("access_token")
                    if access_token:
                        try:
                            from app.infrastructure.auth import decode_token
                            decoded_token = decode_token(access_token)
                            user_id = int(decoded_token.get("sub"))
                            logger.info(f"User ID retrieved from login token: {user_id}")
                        except Exception as e:
                            logger.error(f"Failed to extract user ID from login token: {str(e)}")
                            # Fallback via /me endpoint
                            me_url = f"{settings.AUTH_SERVICE_URL}/api/v1/users/me"
                            me_response = await client.get(
                                me_url,
                                headers={"Authorization": f"Bearer {access_token}"}
                            )
                            if me_response.status_code == 200:
                                user_data = me_response.json()
                                user_id = user_data.get("id")
                                logger.info(f"User ID retrieved via /me endpoint: {user_id}")
                            else:
                                error_detail = me_response.text
                                logger.error(f"Failed to get user ID: {me_response.status_code} - {error_detail}")
                                raise HTTPException(
                                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                    detail=f"Échec de la récupération de l'ID utilisateur: {error_detail}"
                                )
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Token d'accès non reçu lors de la connexion"
                        )
                elif login_response.status_code == 401:
                    # Le mot de passe ne correspond pas, mettre à jour le mot de passe
                    logger.info(f"Password doesn't match, updating password for existing user: {invitation_data.email}")
                    try:
                        update_password_url = f"{settings.AUTH_SERVICE_URL}/api/v1/auth/update-password-by-email"
                        update_password_response = await client.post(
                            update_password_url,
                            json={
                                "email": invitation_data.email,
                                "new_password": invitation_data.password,
                                "internal_token": settings.INTERNAL_SERVICE_TOKEN_SECRET,
                                "first_name": invitation_data.first_name,
                                "last_name": invitation_data.last_name
                            }
                        )
                        
                        if update_password_response.status_code == 200:
                            logger.info(f"Password updated successfully for existing user: {invitation_data.email}")
                            # Maintenant, se connecter avec le nouveau mot de passe pour obtenir l'ID
                            login_response = await client.post(
                                login_url,
                                json={
                                    "email": invitation_data.email,
                                    "password": invitation_data.password
                                }
                            )
                            
                            if login_response.status_code == 200:
                                login_data = login_response.json()
                                access_token = login_data.get("access_token")
                                if access_token:
                                    try:
                                        from app.infrastructure.auth import decode_token
                                        decoded_token = decode_token(access_token)
                                        user_id = int(decoded_token.get("sub"))
                                        logger.info(f"User ID retrieved after password update: {user_id}")
                                    except Exception as e:
                                        logger.error(f"Failed to extract user ID after password update: {str(e)}")
                                        # Fallback via /me endpoint
                                        me_url = f"{settings.AUTH_SERVICE_URL}/api/v1/users/me"
                                        me_response = await client.get(
                                            me_url,
                                            headers={"Authorization": f"Bearer {access_token}"}
                                        )
                                        if me_response.status_code == 200:
                                            user_data = me_response.json()
                                            user_id = user_data.get("id")
                                            logger.info(f"User ID retrieved via /me endpoint after password update: {user_id}")
                                        else:
                                            raise HTTPException(
                                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                                detail="Échec de la récupération de l'ID utilisateur après mise à jour du mot de passe"
                                            )
                                else:
                                    raise HTTPException(
                                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                        detail="Token d'accès non reçu après mise à jour du mot de passe"
                                    )
                            else:
                                error_detail = login_response.text
                                logger.error(f"Failed to login after password update: {login_response.status_code} - {error_detail}")
                                raise HTTPException(
                                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                    detail=f"Impossible de se connecter après la mise à jour du mot de passe: {error_detail}"
                                )
                        else:
                            error_detail = update_password_response.text
                            logger.error(f"Failed to update password: {update_password_response.status_code} - {error_detail}")
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"Impossible de mettre à jour le mot de passe: {error_detail}"
                            )
                    except httpx.HTTPError as e:
                        logger.error(f"Error updating password: {str(e)}")
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Erreur lors de la mise à jour du mot de passe: {str(e)}"
                        )
                else:
                    error_detail = login_response.text
                    logger.error(f"Failed to login existing user: {login_response.status_code} - {error_detail}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Impossible de se connecter avec le compte existant: {error_detail}"
                    )
                
                # Générer un token de réinitialisation de mot de passe pour l'utilisateur existant
                logger.info(f"Generating password reset token for existing user: {user_id}")
                reset_token_url = f"{settings.AUTH_SERVICE_URL}/api/v1/auth/generate-password-reset-token"
                try:
                    reset_token_response = await client.post(
                        reset_token_url,
                        json={
                            "email": invitation_data.email,
                            "internal_token": settings.INTERNAL_SERVICE_TOKEN_SECRET
                        }
                    )
                    
                    if reset_token_response.status_code == 200:
                        reset_token_data = reset_token_response.json()
                        password_reset_token = reset_token_data.get("reset_token")
                        logger.info(f"Password reset token generated successfully for existing user")
                    else:
                        error_detail = reset_token_response.text
                        logger.warning(f"Failed to generate password reset token: {reset_token_response.status_code} - {error_detail}")
                except Exception as e:
                    logger.warning(f"Error generating password reset token: {str(e)}")
            else:
                error_detail = register_response.text
                logger.error(f"Failed to create user: {register_response.status_code} - {error_detail}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Échec de la création du compte: {error_detail}"
                )
                
        except httpx.HTTPError as e:
            error_msg = str(e) or repr(e) or "Erreur de connexion inconnue"
            logger.error(f"Connection error when communicating with auth service: {error_msg}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Impossible de se connecter au service d'authentification: {error_msg}"
            )
        except HTTPException:
            raise
        except Exception as e:
            error_msg = str(e) or repr(e) or f"Erreur de type {type(e).__name__}"
            logger.error(f"Unexpected error when creating user: {error_msg}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur inattendue lors de la création du compte: {error_msg}"
            )
    
    if not user_id:
        logger.error(f"Failed to retrieve user_id after all attempts for email: {invitation_data.email}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Échec de la récupération de l'identifiant utilisateur. Veuillez réessayer ou contacter le support."
        )
    
    logger.info(f"User ID successfully retrieved: {user_id} for email: {invitation_data.email}")
    
    # Vérifier si l'utilisateur est déjà membre de cette entreprise
    existing_member = await team_member_repo.get_by_user_id(user_id)
    if existing_member:
        if existing_member.company_id == company.id:
            logger.warning(f"User {user_id} is already a team member of company {company.id}")
            # Mettre à jour l'invitation existante si elle existe pour le suivi
            invitation_repo = InvitationRepository(session)
            from sqlalchemy import select
            statement = select(Invitation).where(
                Invitation.email == invitation_data.email,
                Invitation.company_id == company.id
            ).order_by(Invitation.created_at.desc()).limit(1)
            result = await session.execute(statement)
            existing_invitation = result.scalar_one_or_none()
            
            if existing_invitation:
                # Mettre à jour l'invitation existante pour le suivi
                existing_invitation.status = InvitationStatus.ACCEPTED
                existing_invitation.accepted_at = datetime.utcnow()
                existing_invitation.first_name = invitation_data.first_name
                existing_invitation.last_name = invitation_data.last_name
                if not existing_invitation.token or existing_invitation.token == "":
                    existing_invitation.token = generate_invitation_token()
                await invitation_repo.update(existing_invitation)
            
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cet utilisateur ({invitation_data.email}) est déjà membre de votre entreprise"
            )
        else:
            logger.warning(f"User {user_id} is already a team member of another company ({existing_member.company_id})")
            # Permettre à l'utilisateur d'être membre de plusieurs entreprises
            # ou lever une exception selon les règles métier
            # Pour l'instant, on permet à l'utilisateur d'être membre de plusieurs entreprises
    
    # Créer le TeamMember immédiatement
    logger.info(f"Creating team member for user {user_id}, company {company.id}")
    team_member = TeamMember(
        user_id=user_id,
        company_id=company.id,
        role_in_company=TeamMemberRole.RECRUTEUR,
        status=TeamMemberStatus.ACTIVE,
        joined_at=datetime.utcnow(),
    )
    team_member = await team_member_repo.create(team_member)
    logger.info(f"Team member created: {team_member.id}")
    
    # Créer ou mettre à jour une invitation pour le suivi (statut ACCEPTED car le compte est déjà créé)
    invitation_repo = InvitationRepository(session)
    
    # Vérifier si une invitation existe déjà pour cet email et cette entreprise
    # Chercher toutes les invitations pour cet email et cette entreprise, pas seulement les pending
    from sqlalchemy import select
    statement = select(Invitation).where(
        Invitation.email == invitation_data.email,
        Invitation.company_id == company.id
    ).order_by(Invitation.created_at.desc()).limit(1)
    result = await session.execute(statement)
    existing_invitation = result.scalar_one_or_none()
    
    if existing_invitation:
        # Mettre à jour l'invitation existante
        logger.info(f"Updating existing invitation {existing_invitation.id} for email {invitation_data.email}")
        existing_invitation.status = InvitationStatus.ACCEPTED
        existing_invitation.accepted_at = datetime.utcnow()
        existing_invitation.expires_at = datetime.utcnow() + timedelta(days=7)
        existing_invitation.first_name = invitation_data.first_name
        existing_invitation.last_name = invitation_data.last_name
        # Générer un token unique si le token existant est vide
        if not existing_invitation.token or existing_invitation.token == "":
            existing_invitation.token = generate_invitation_token()
        invitation = await invitation_repo.update(existing_invitation)
    else:
        # Créer une nouvelle invitation avec un token unique (même si on ne l'utilise pas pour le flux)
        # On génère un token unique pour respecter la contrainte unique sur le champ token
        logger.info(f"Creating new invitation for email {invitation_data.email}")
        invitation = Invitation(
            company_id=company.id,
            email=invitation_data.email,
            first_name=invitation_data.first_name,
            last_name=invitation_data.last_name,
            token=generate_invitation_token(),  # Token unique pour éviter la violation de contrainte
            role=TeamMemberRole.RECRUTEUR,
            status=InvitationStatus.ACCEPTED,  # Déjà accepté car le compte est créé
            expires_at=datetime.utcnow() + timedelta(days=7),  # Pour l'historique
            invited_by=current_user.user_id,
            accepted_at=datetime.utcnow(),
        )
        invitation = await invitation_repo.create(invitation)
    
    # Envoyer l'email avec le lien de réinitialisation de mot de passe
    if password_reset_token:
        password_reset_url = f"{settings.FRONTEND_URL}/reset-password?token={password_reset_token}"
    else:
        # Fallback: générer un nouveau token si le premier a échoué
        logger.warning("Password reset token not available, attempting to generate one")
        # Pour l'instant, on envoie un message générique
        password_reset_url = f"{settings.FRONTEND_URL}/reset-password"
    
    recipient_name = f"{invitation_data.first_name} {invitation_data.last_name}"
    
    # Envoyer l'email avec le lien de réinitialisation de mot de passe
    try:
        logger.info(f"Attempting to send invitation email to {invitation_data.email}")
        await send_invitation_notification(
            recipient_email=invitation_data.email,
            recipient_name=recipient_name,
            company_name=company.name,
            invitation_token="",  # Token vide car on utilise le password reset token
            invitation_url=password_reset_url,  # Lien de réinitialisation
            temporary_password=invitation_data.password  # Mot de passe temporaire à inclure dans l'email
        )
        logger.info(f"Invitation email sent successfully to {invitation_data.email}")
    except Exception as e:
        logger.error(f"❌ Error sending invitation notification to {invitation_data.email}: {str(e)}", exc_info=True)
        # On continue quand même car le compte et le team member ont été créés
        # Mais on log l'erreur pour le débogage
    
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
                register_payload = {
                    "email": invitation.email,
                    "password": accept_data.password,
                    "first_name": accept_data.first_name,
                    "last_name": accept_data.last_name,
                    "role": "ROLE_RECRUITER"
                }
                logger.info(f"Register payload (password hidden): email={invitation.email}, first_name={accept_data.first_name}, last_name={accept_data.last_name}, role=ROLE_RECRUITER")
                register_response = await client.post(
                    register_url,
                    json=register_payload
                )
                logger.info(f"Register response status: {register_response.status_code}")
                if register_response.status_code != 200 and register_response.status_code != 201:
                    logger.warning(f"Register response body: {register_response.text}")
                
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
                    # Dans le contexte d'une invitation, si l'utilisateur existe déjà mais n'a pas encore accepté cette invitation,
                    # on doit permettre de lier le compte à l'entreprise avec le mot de passe fourni.
                    # On essaie d'abord de se connecter avec le mot de passe fourni pour vérifier s'il correspond
                    logger.info(f"User already exists (409), attempting to link account with provided password: {invitation.email}")
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
                        # Dans le contexte d'une invitation valide, on peut permettre de mettre à jour le mot de passe
                        # car l'invitation est une preuve d'autorisation
                        error_detail = login_response.text
                        logger.warning(f"Failed to login existing user: Invalid password - {error_detail}")
                        logger.info(f"User {invitation.email} exists but password doesn't match. Attempting to update password via invitation.")
                        
                        # Mettre à jour le mot de passe via l'endpoint inter-services
                        try:
                            update_password_url = f"{settings.AUTH_SERVICE_URL}/api/v1/auth/update-password-by-email"
                            update_password_response = await client.post(
                                update_password_url,
                                json={
                                    "email": invitation.email,
                                    "new_password": accept_data.password,
                                    "internal_token": settings.INTERNAL_SERVICE_TOKEN_SECRET,
                                    "first_name": accept_data.first_name,
                                    "last_name": accept_data.last_name
                                }
                            )
                            
                            if update_password_response.status_code == 200:
                                logger.info(f"Password updated successfully for user {invitation.email}")
                                # Maintenant, essayer de se connecter avec le nouveau mot de passe
                                login_response = await client.post(
                                    login_url,
                                    json={
                                        "email": invitation.email,
                                        "password": accept_data.password
                                    }
                                )
                                
                                if login_response.status_code == 200:
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
                                                logger.info(f"User ID retrieved from /me endpoint after password update: {user_id}")
                                            else:
                                                error_detail = me_response.text
                                                logger.error(f"Failed to get user from /me after password update: {me_response.status_code} - {error_detail}")
                                                raise HTTPException(
                                                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                                    detail=f"Échec de la récupération de l'ID utilisateur après mise à jour du mot de passe: {error_detail}"
                                                )
                                        except HTTPException:
                                            raise
                                        except Exception as e:
                                            logger.error(f"Error getting user from /me after password update: {str(e)}")
                                            raise HTTPException(
                                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                                detail=f"Failed to retrieve user ID after password update: {str(e)}"
                                            )
                                    else:
                                        raise HTTPException(
                                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                            detail="No access token in login response after password update"
                                        )
                                else:
                                    error_detail = login_response.text
                                    logger.error(f"Failed to login after password update: {login_response.status_code} - {error_detail}")
                                    raise HTTPException(
                                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                        detail=f"Impossible de se connecter après la mise à jour du mot de passe: {error_detail}"
                                    )
                            else:
                                error_detail = update_password_response.text
                                logger.error(f"Failed to update password: {update_password_response.status_code} - {error_detail}")
                                raise HTTPException(
                                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                    detail=f"Impossible de mettre à jour le mot de passe: {error_detail}"
                                )
                        except httpx.HTTPError as e:
                            logger.error(f"Error updating password: {str(e)}")
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"Erreur lors de la mise à jour du mot de passe: {str(e)}"
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
                error_detail = ""
                if e.response:
                    try:
                        error_detail = e.response.text
                        if not error_detail and e.response.content:
                            error_detail = e.response.content.decode('utf-8', errors='ignore')
                    except:
                        error_detail = f"HTTP {e.response.status_code}"
                if not error_detail:
                    error_detail = str(e) or repr(e)
                logger.error(f"HTTP error when communicating with auth service: {e.response.status_code if e.response else 'unknown'} - {error_detail}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Échec de la création ou vérification du compte utilisateur: {error_detail}"
                )
            except httpx.HTTPError as e:
                error_msg = str(e) or repr(e) or "Erreur de connexion inconnue"
                logger.error(f"Connection error when communicating with auth service: {error_msg}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Impossible de se connecter au service d'authentification: {error_msg}"
                )
            except HTTPException:
                # Propager les HTTPException directement (elles ont déjà le bon format)
                raise
            except Exception as e:
                # Si c'est une HTTPException mais qu'elle n'a pas été attrapée par le bloc précédent,
                # extraire son detail
                if isinstance(e, HTTPException):
                    raise
                error_msg = str(e) or repr(e) or f"Erreur de type {type(e).__name__}"
                logger.error(f"Unexpected error when communicating with auth service: {error_msg}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Erreur inattendue lors de la communication avec le service d'authentification: {error_msg}"
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
        error_msg = str(e) if str(e) else repr(e)
        error_type = type(e).__name__
        logger.error(f"Unexpected error in accept_invitation: {error_type}: {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur serveur ({error_type}): {error_msg if error_msg else 'Erreur inconnue'}"
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

