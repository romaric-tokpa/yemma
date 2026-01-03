"""
Repositories pour l'accès aux données
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlmodel import select as sqlmodel_select

from app.domain.models import User, Role, UserRoleLink, RefreshToken
from app.domain.exceptions import UserNotFoundError, UserAlreadyExistsError


class UserRepository:
    """Repository pour les opérations sur les utilisateurs"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Récupère un utilisateur par ID"""
        result = await self.session.get(User, user_id)
        return result
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Récupère un utilisateur par email"""
        statement = select(User).where(User.email == email, User.deleted_at.is_(None))
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def create(self, user: User) -> User:
        """Crée un nouvel utilisateur"""
        # Vérifier si l'email existe déjà
        existing = await self.get_by_email(user.email)
        if existing:
            raise UserAlreadyExistsError(user.email)
        
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def update(self, user: User) -> User:
        """Met à jour un utilisateur"""
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def get_user_roles(self, user_id: int) -> List[Role]:
        """Récupère les rôles d'un utilisateur"""
        statement = (
            select(Role)
            .join(UserRoleLink)
            .where(UserRoleLink.user_id == user_id)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())


class RoleRepository:
    """Repository pour les opérations sur les rôles"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_name(self, name: str) -> Optional[Role]:
        """Récupère un rôle par nom"""
        statement = select(Role).where(Role.name == name)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_or_create(self, name: str, description: Optional[str] = None) -> Role:
        """Récupère un rôle ou le crée s'il n'existe pas"""
        role = await self.get_by_name(name)
        if not role:
            role = Role(name=name, description=description)
            self.session.add(role)
            await self.session.commit()
            await self.session.refresh(role)
        return role


class RefreshTokenRepository:
    """Repository pour les refresh tokens"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, refresh_token: RefreshToken) -> RefreshToken:
        """Crée un refresh token"""
        self.session.add(refresh_token)
        await self.session.commit()
        await self.session.refresh(refresh_token)
        return refresh_token
    
    async def get_by_token(self, token: str) -> Optional[RefreshToken]:
        """Récupère un refresh token par token"""
        statement = select(RefreshToken).where(
            RefreshToken.token == token,
            RefreshToken.is_revoked == False
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def revoke_token(self, token: str) -> bool:
        """Révoque un refresh token"""
        refresh_token = await self.get_by_token(token)
        if refresh_token:
            refresh_token.is_revoked = True
            await self.session.commit()
            return True
        return False
    
    async def revoke_user_tokens(self, user_id: int) -> int:
        """Révoque tous les tokens d'un utilisateur"""
        statement = (
            select(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False)
        )
        result = await self.session.execute(statement)
        tokens = result.scalars().all()
        
        count = 0
        for token in tokens:
            token.is_revoked = True
            count += 1
        
        await self.session.commit()
        return count

