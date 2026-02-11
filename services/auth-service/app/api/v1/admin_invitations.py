"""
Endpoints pour la gestion des invitations d'administrateurs
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import secrets

from app.domain.schemas import (
    AdminInvitationCreate,
    AdminInvitationResponse,
    AdminRegisterViaToken,
    Token,
)
from app.domain.models import User, UserRoleLink, AdminInvitationToken, UserStatus, RefreshToken
from app.domain.exceptions import InvalidCredentialsError
from app.infrastructure.database import get_session
from app.infrastructure.security import (
    hash_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    require_role,
)
from app.infrastructure.repositories import (
    UserRepository,
    RoleRepository,
    RefreshTokenRepository,
    AdminInvitationTokenRepository,
)
from app.core.config import settings
from app.domain.schemas import TokenData

router = APIRouter()


def generate_invitation_token() -> str:
    """Génère un token sécurisé pour l'invitation admin"""
    return secrets.token_urlsafe(32)


@router.post("/admin-invitations/generate", response_model=AdminInvitationResponse, status_code=status.HTTP_201_CREATED)
async def generate_admin_invitation(
    request: AdminInvitationCreate,
    current_user: TokenData = Depends(require_role("ROLE_SUPER_ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """
    Génère un token d'invitation pour créer un compte administrateur.
    Accessible uniquement aux SUPER_ADMIN.
    """
    user_repo = UserRepository(session)
    invitation_repo = AdminInvitationTokenRepository(session)
    
    # Vérifier que l'email n'existe pas déjà
    existing_user = await user_repo.get_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Un compte avec l'email {request.email} existe déjà."
        )
    
    # Valider le rôle
    if request.role not in ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le rôle doit être ROLE_ADMIN ou ROLE_SUPER_ADMIN"
        )
    
    # Générer le token
    token = generate_invitation_token()
    expires_at = datetime.utcnow() + timedelta(hours=request.expires_in_hours)
    
    # Créer l'invitation
    invitation = AdminInvitationToken(
        token=token,
        email=request.email,
        role=request.role,
        created_by_user_id=current_user.user_id,
        expires_at=expires_at,
    )
    
    invitation = await invitation_repo.create(invitation)
    
    # Construire l'URL d'invitation
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    invitation_url = f"{frontend_url}/admin/create-account?token={token}"
    
    return AdminInvitationResponse(
        id=invitation.id,
        token=invitation.token,
        email=invitation.email,
        role=invitation.role,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
        is_used=invitation.is_used,
        invitation_url=invitation_url,
    )


@router.get("/admin-invitations/validate/{token}", status_code=status.HTTP_200_OK)
async def validate_invitation_token(
    token: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Valide un token d'invitation et retourne les informations associées.
    Accessible publiquement pour vérifier le token avant l'inscription.
    Sécurisé avec validation renforcée.
    """
    invitation_repo = AdminInvitationTokenRepository(session)
    
    # Validation basique du token
    if not token or len(token.strip()) < 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format de token invalide"
        )
    
    invitation = await invitation_repo.get_by_token(token.strip())
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token d'invitation invalide ou déjà utilisé"
        )
    
    # Vérifier que le token n'a pas déjà été utilisé
    if invitation.is_used:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Ce token d'invitation a déjà été utilisé"
        )
    
    # Vérifier l'expiration
    if invitation.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Le token d'invitation a expiré"
        )
    
    return {
        "email": invitation.email,
        "role": invitation.role,
        "expires_at": invitation.expires_at.isoformat(),
        "is_valid": True
    }


@router.post("/admin-invitations/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_admin_via_token(
    request: AdminRegisterViaToken,
    session: AsyncSession = Depends(get_session)
):
    """
    Crée un compte administrateur via un token d'invitation.
    Accessible publiquement via le token d'invitation.
    Sécurisé avec validation renforcée.
    """
    user_repo = UserRepository(session)
    role_repo = RoleRepository(session)
    refresh_token_repo = RefreshTokenRepository(session)
    invitation_repo = AdminInvitationTokenRepository(session)
    
    # Validation du token (doit être présent et non vide)
    if not request.token or len(request.token.strip()) < 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token d'invitation invalide"
        )
    
    # Valider le token d'invitation
    invitation = await invitation_repo.get_by_token(request.token.strip())
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token d'invitation invalide ou déjà utilisé"
        )
    
    # Vérifier que le token n'a pas déjà été utilisé
    if invitation.is_used:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Ce token d'invitation a déjà été utilisé"
        )
    
    # Vérifier l'expiration
    if invitation.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Le token d'invitation a expiré"
        )
    
    # Vérifier que l'email correspond au token (case-insensitive)
    if invitation.email.lower() != request.email.lower().strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'email fourni ne correspond pas au token d'invitation"
        )
    
    # Validation du mot de passe (doit être présent et respecter les critères)
    if not request.password or len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins 8 caractères"
        )
    
    # Vérifier que l'utilisateur n'existe pas déjà
    existing_user = await user_repo.get_by_email(invitation.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Un compte avec l'email {invitation.email} existe déjà."
        )
    
    # Créer l'utilisateur admin
    hashed_password = hash_password(request.password)
    user = User(
        email=invitation.email.lower().strip(),
        hashed_password=hashed_password,
        first_name=request.first_name.strip() if request.first_name else None,
        last_name=request.last_name.strip() if request.last_name else None,
        status=UserStatus.ACTIVE,  # Activer directement pour les admins
        is_email_verified=True,  # Considéré comme vérifié via l'invitation
    )
    
    user = await user_repo.create(user)
    
    # Assigner le rôle admin
    role = await role_repo.get_or_create(invitation.role)
    user_role = UserRoleLink(user_id=user.id, role_id=role.id)
    session.add(user_role)
    await session.commit()
    
    # Marquer le token comme utilisé (atomique pour éviter les doubles utilisations)
    await invitation_repo.mark_as_used(request.token.strip(), user.id)
    
    # Créer les tokens JWT
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "roles": [role.name],
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


@router.get("/admin-invitations", response_model=list[AdminInvitationResponse], status_code=status.HTTP_200_OK)
async def list_admin_invitations(
    skip: int = 0,
    limit: int = 100,
    current_user: TokenData = Depends(require_role("ROLE_SUPER_ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """
    Liste tous les tokens d'invitation admin.
    Accessible uniquement aux SUPER_ADMIN.
    """
    invitation_repo = AdminInvitationTokenRepository(session)
    invitations = await invitation_repo.get_all(skip=skip, limit=limit)
    
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    
    return [
        AdminInvitationResponse(
            id=inv.id,
            token=inv.token,
            email=inv.email,
            role=inv.role,
            expires_at=inv.expires_at,
            created_at=inv.created_at,
            is_used=inv.is_used,
            invitation_url=f"{frontend_url}/admin/create-account?token={inv.token}",
        )
        for inv in invitations
    ]
