"""
Validation JWT et authentification
"""
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


class TokenData(BaseModel):
    """Données contenues dans le token JWT (Pydantic pour compatibilité FastAPI/OpenAPI)"""
    user_id: int
    email: str
    roles: List[str] = []

    class Config:
        from_attributes = True


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[TokenData]:
    """
    Valide le token JWT et retourne les données utilisateur
    
    Retourne None si aucun token n'est fourni (pour permettre les appels inter-services)
    """
    if not token:
        return None
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: int = int(payload.get("sub"))
        email: str = payload.get("email")
        roles_raw = payload.get("roles", []) or []
        roles_list = [str(r) for r in roles_raw] if isinstance(roles_raw, list) else []

        if user_id is None or email is None:
            return None

        return TokenData(user_id=user_id, email=email, roles=roles_list)
    except (JWTError, ValueError, TypeError):
        return None


def require_current_user(current_user: Optional[TokenData]) -> TokenData:
    """
    Vérifie que current_user n'est pas None et lève une exception si c'est le cas

    Utilisé dans les endpoints qui nécessitent une authentification utilisateur
    """
    if not current_user or not hasattr(current_user, 'user_id') or not current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return current_user


def require_admin_role(current_user: Optional[TokenData]) -> TokenData:
    """
    Vérifie que l'utilisateur a le rôle admin (ROLE_ADMIN ou ROLE_SUPER_ADMIN).

    Utilisé pour les endpoints admin (création/modification d'offres).
    """
    if not current_user or not hasattr(current_user, 'roles') or not current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    admin_roles = {"ROLE_ADMIN", "ROLE_SUPER_ADMIN"}
    if not admin_roles.intersection(set(current_user.roles)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    return current_user


async def require_admin_role_dep(
    current_user: Optional[TokenData] = Depends(get_current_user),
) -> TokenData:
    """Dépendance FastAPI pour exiger le rôle admin."""
    return require_admin_role(current_user)

