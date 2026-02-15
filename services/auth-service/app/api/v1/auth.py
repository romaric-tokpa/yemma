"""
Endpoints d'authentification
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.schemas import (
    LoginRequest,
    RegisterRequest,
    Token,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    PasswordChange,
    PasswordUpdateByEmail,
    GeneratePasswordResetTokenRequest,
)
from app.domain.models import User, UserRoleLink, RefreshToken, UserStatus
from app.domain.exceptions import InvalidCredentialsError, UserNotFoundError
from app.infrastructure.database import get_session
from app.infrastructure.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_token_data,
    get_current_user,
)
from app.infrastructure.repositories import (
    UserRepository,
    RoleRepository,
    RefreshTokenRepository,
)
from app.core.config import settings

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    session: AsyncSession = Depends(get_session)
):
    """Inscription d'un nouvel utilisateur"""
    user_repo = UserRepository(session)
    role_repo = RoleRepository(session)
    
    # Vérifier si l'utilisateur existe déjà
    existing_user = await user_repo.get_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Un compte avec l'email {request.email} existe déjà. Veuillez vous connecter ou utiliser un autre email."
        )
    
    # Créer l'utilisateur
    hashed_password = hash_password(request.password)
    user = User(
        email=request.email,
        hashed_password=hashed_password,
        first_name=request.first_name,
        last_name=request.last_name,
    )
    user = await user_repo.create(user)
    
    # Assigner le rôle
    role = await role_repo.get_or_create(request.role)
    user_role = UserRoleLink(user_id=user.id, role_id=role.id)
    session.add(user_role)
    await session.commit()
    
    # Créer les tokens
    token_data = {
        "sub": str(user.id),  # python-jose exige que sub soit une chaîne
        "email": user.email,
        "roles": [role.name],
    }
    access_token = create_access_token(token_data)
    refresh_token_str = create_refresh_token(token_data)
    
    # Sauvegarder le refresh token
    refresh_token_repo = RefreshTokenRepository(session)
    refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    )
    await refresh_token_repo.create(refresh_token)

    # Envoyer un email après inscription (compte créé + rappel onboarding)
    import logging
    _log = logging.getLogger(__name__)
    if request.role == "ROLE_CANDIDAT":
        try:
            from app.infrastructure.notification_client import send_candidate_registration_notification
            candidate_name = (
                f"{(request.first_name or '').strip()} {(request.last_name or '').strip()}".strip()
                or request.email.split("@")[0]
            )
            onboarding_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/onboarding"
            _log.info("Envoi email inscription candidat: %s (notification_url=%s)", request.email, getattr(settings, "NOTIFICATION_SERVICE_URL", "?"))
            await send_candidate_registration_notification(
                candidate_email=request.email,
                candidate_name=candidate_name,
                onboarding_url=onboarding_url,
            )
            _log.info("Demande email inscription candidat envoyée au service notification pour %s", request.email)
        except Exception as e:
            _log.warning("Impossible d'envoyer l'email d'inscription candidat à %s: %s", request.email, e, exc_info=True)
    elif request.role == "ROLE_COMPANY_ADMIN":
        try:
            from app.infrastructure.notification_client import send_company_registration_notification
            recipient_name = (
                f"{(request.first_name or '').strip()} {(request.last_name or '').strip()}".strip()
                or request.email.split("@")[0]
            )
            onboarding_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/company/onboarding"
            _log.info("Envoi email inscription recruteur: %s (notification_url=%s)", request.email, getattr(settings, "NOTIFICATION_SERVICE_URL", "?"))
            await send_company_registration_notification(
                recipient_email=request.email,
                recipient_name=recipient_name,
                onboarding_url=onboarding_url,
            )
            _log.info("Demande email inscription recruteur envoyée au service notification pour %s", request.email)
        except Exception as e:
            _log.warning("Impossible d'envoyer l'email d'inscription recruteur à %s: %s", request.email, e, exc_info=True)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token_str,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/login", response_model=Token)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_session)
):
    """Connexion d'un utilisateur"""
    user_repo = UserRepository(session)
    role_repo = RoleRepository(session)
    refresh_token_repo = RefreshTokenRepository(session)
    
    # Récupérer l'utilisateur
    user = await user_repo.get_by_email(request.email)
    if not user:
        raise InvalidCredentialsError()
    
    # Utilisateur OAuth uniquement : ne peut pas se connecter avec mot de passe
    if user.hashed_password is None or user.oauth_provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce compte utilise une connexion Google ou LinkedIn. Utilisez le bouton correspondant pour vous connecter."
        )
    
    # Vérifier le mot de passe
    if not verify_password(request.password, user.hashed_password):
        raise InvalidCredentialsError()
    
    # Vérifier le statut
    # En développement, permettre la connexion même si le statut est PENDING_VERIFICATION
    # En production, seuls les comptes ACTIVE peuvent se connecter
    if user.status not in [UserStatus.ACTIVE, UserStatus.PENDING_VERIFICATION]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active"
        )
    
    # Récupérer les rôles
    roles = await user_repo.get_user_roles(user.id)
    role_names = [role.name for role in roles]
    
    # Mettre à jour la dernière connexion
    user.last_login = datetime.utcnow()
    await user_repo.update(user)
    
    # Créer les tokens
    token_data = {
        "sub": str(user.id),  # python-jose exige que sub soit une chaîne
        "email": user.email,
        "roles": role_names,
    }
    access_token = create_access_token(token_data)
    refresh_token_str = create_refresh_token(token_data)
    
    # Sauvegarder le refresh token
    refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    )
    await refresh_token_repo.create(refresh_token)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token_str,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session)
):
    """Rafraîchit un access token"""
    refresh_token_repo = RefreshTokenRepository(session)
    user_repo = UserRepository(session)
    
    # Vérifier le refresh token
    stored_token = await refresh_token_repo.get_by_token(request.refresh_token)
    if not stored_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Vérifier l'expiration
    if stored_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    
    # Décoder le token
    try:
        token_data = get_token_data(request.refresh_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Récupérer l'utilisateur et ses rôles
    user = await user_repo.get_by_id(token_data.user_id)
    if not user:
        raise UserNotFoundError(str(token_data.user_id))
    
    roles = await user_repo.get_user_roles(user.id)
    role_names = [role.name for role in roles]
    
    # Créer un nouveau access token
    new_token_data = {
        "sub": str(user.id),  # python-jose exige que sub soit une chaîne
        "email": user.email,
        "roles": role_names,
    }
    access_token = create_access_token(new_token_data)
    
    return Token(
        access_token=access_token,
        refresh_token=request.refresh_token,  # Le refresh token reste le même
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout")
async def logout(
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Déconnexion (révoque le refresh token)"""
    refresh_token_repo = RefreshTokenRepository(session)
    # Note: Dans une implémentation complète, on devrait révoquer le token spécifique
    # Pour l'instant, on retourne juste un succès
    return {"message": "Logged out successfully"}


@router.post("/password-reset")
async def password_reset(
    request: PasswordResetRequest,
    session: AsyncSession = Depends(get_session)
):
    """Demande de réinitialisation de mot de passe"""
    import asyncio
    import logging
    from app.infrastructure.security import generate_password_reset_token
    from app.infrastructure.notification_client import send_password_reset_notification
    from app.core.config import settings

    _log = logging.getLogger(__name__)
    user_repo = UserRepository(session)
    user = await user_repo.get_by_email(request.email)
    
    response_data = {"message": "If the email exists, a password reset link has been sent"}
    if user:
        # Générer un token de réinitialisation
        reset_token = generate_password_reset_token()
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=24)  # Token valide 24h
        await user_repo.update(user)
        
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        recipient_name = f"{user.first_name} {user.last_name}".strip() if (user.first_name or user.last_name) else None
        # Fire-and-forget : ne pas bloquer la réponse, l'email est envoyé en arrière-plan
        asyncio.create_task(send_password_reset_notification(
            recipient_email=user.email,
            reset_url=reset_url,
            recipient_name=recipient_name,
        ))
    
    return response_data


@router.post("/password-reset/confirm")
async def password_reset_confirm(
    request: PasswordResetConfirm,
    session: AsyncSession = Depends(get_session)
):
    """Confirme la réinitialisation de mot de passe"""
    user_repo = UserRepository(session)
    
    # Trouver l'utilisateur par token de réinitialisation
    statement = select(User).where(
        User.password_reset_token == request.token,
        User.password_reset_expires > datetime.utcnow(),
        User.deleted_at.is_(None)
    )
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token"
        )
    
    # Mettre à jour le mot de passe
    user.hashed_password = hash_password(request.new_password)
    user.password_reset_token = None  # Invalider le token après utilisation
    user.password_reset_expires = None
    user.updated_at = datetime.utcnow()
    await user_repo.update(user)
    
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    request: PasswordChange,
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Change le mot de passe de l'utilisateur connecté"""
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(current_user.user_id)

    if not user:
        raise UserNotFoundError(str(current_user.user_id))

    # Vérifier le mot de passe actuel (sauf pour les utilisateurs OAuth qui n'en ont pas)
    if user.oauth_provider:
        # Utilisateur OAuth (Google, LinkedIn) : pas de mot de passe actuel, on définit directement le nouveau
        pass
    elif not user.hashed_password or not verify_password(request.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect"
        )

    # Mettre à jour le mot de passe
    user.hashed_password = hash_password(request.new_password)
    # Si c'était un compte OAuth, autoriser aussi la connexion par mot de passe
    if user.oauth_provider:
        user.oauth_provider = None
        user.oauth_id = None
    await user_repo.update(user)

    return {"message": "Password changed successfully"}


@router.post("/update-password-by-email")
async def update_password_by_email(
    request: PasswordUpdateByEmail,
    session: AsyncSession = Depends(get_session)
):
    """
    Met à jour le mot de passe d'un utilisateur par email.
    Sécurisé par INTERNAL_SERVICE_TOKEN_SECRET pour les appels inter-services.
    Utilisé notamment pour les invitations où l'utilisateur peut définir son mot de passe.
    """
    # Vérifier le token interne
    if request.internal_token != settings.INTERNAL_SERVICE_TOKEN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service token"
        )
    
    user_repo = UserRepository(session)
    user = await user_repo.get_by_email(request.email)
    
    if not user:
        raise UserNotFoundError(request.email)
    
    # Mettre à jour le mot de passe et les informations si fournies
    user.hashed_password = hash_password(request.new_password)
    if request.first_name is not None:
        user.first_name = request.first_name
    if request.last_name is not None:
        user.last_name = request.last_name
    user.updated_at = datetime.utcnow()
    await user_repo.update(user)
    
    return {"message": "Password updated successfully"}


@router.post("/generate-password-reset-token")
async def generate_password_reset_token_endpoint(
    request: GeneratePasswordResetTokenRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Génère un token de réinitialisation de mot de passe pour un utilisateur.
    Sécurisé par INTERNAL_SERVICE_TOKEN_SECRET pour les appels inter-services.
    Utilisé lors de la création de compte par invitation.
    """
    from app.infrastructure.security import generate_password_reset_token
    
    # Vérifier le token interne
    if request.internal_token != settings.INTERNAL_SERVICE_TOKEN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service token"
        )
    
    user_repo = UserRepository(session)
    user = await user_repo.get_by_email(request.email)
    
    if not user:
        raise UserNotFoundError(request.email)
    
    # Générer un token de réinitialisation
    reset_token = generate_password_reset_token()
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=24)  # Token valide 24h
    await user_repo.update(user)
    
    return {"reset_token": reset_token, "expires_at": user.password_reset_expires.isoformat()}


@router.get("/validate")
async def validate_token(
    current_user = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Valide un token JWT et retourne les informations de l'utilisateur

    Utilisé par les autres microservices pour valider les tokens des utilisateurs.
    """
    user_repo = UserRepository(session)

    # Récupérer l'utilisateur complet pour avoir company_id si disponible
    user = await user_repo.get_by_id(current_user.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Récupérer les rôles
    roles = await user_repo.get_user_roles(user.id)
    role_names = [role.name for role in roles]

    return {
        "user_id": user.id,
        "email": user.email,
        "roles": role_names,
        "company_id": getattr(user, 'company_id', None),
        "first_name": user.first_name,
        "last_name": user.last_name,
    }

