"""
Endpoints de gestion des utilisateurs
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.schemas import UserResponse, UserDetailResponse, UserUpdate
from app.domain.exceptions import UserNotFoundError
from app.infrastructure.database import get_session
from app.infrastructure.security import get_current_user, require_role
from app.infrastructure.repositories import UserRepository
from app.domain.schemas import TokenData

router = APIRouter()


@router.get("/me", response_model=UserDetailResponse)
async def get_current_user_info(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Récupère les informations de l'utilisateur connecté"""
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(current_user.user_id)
    
    if not user:
        raise UserNotFoundError(str(current_user.user_id))
    
    # Récupérer les rôles
    roles = await user_repo.get_user_roles(user.id)
    role_names = [role.name for role in roles]
    
    return UserDetailResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        status=user.status.value,
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=user.last_login,
        roles=role_names,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: TokenData = Depends(require_role("ROLE_ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Récupère un utilisateur par ID (admin seulement)"""
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    
    if not user:
        raise UserNotFoundError(str(user_id))
    
    # Récupérer les rôles
    roles = await user_repo.get_user_roles(user.id)
    role_names = [role.name for role in roles]
    
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        status=user.status.value,
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=role_names,
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Met à jour les informations de l'utilisateur connecté"""
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(current_user.user_id)
    
    if not user:
        raise UserNotFoundError(str(current_user.user_id))
    
    # Mettre à jour les champs
    if user_update.first_name is not None:
        user.first_name = user_update.first_name
    if user_update.last_name is not None:
        user.last_name = user_update.last_name
    
    user = await user_repo.update(user)
    
    # Récupérer les rôles
    roles = await user_repo.get_user_roles(user.id)
    role_names = [role.name for role in roles]
    
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        status=user.status.value,
        is_email_verified=user.is_email_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=role_names,
    )

