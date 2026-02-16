"""
Validation JWT et vérification du rôle Admin
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


class TokenData:
    """Données contenues dans le token JWT"""

    def __init__(self, user_id: int, email: str, roles: list):
        self.user_id = user_id
        self.email = email
        self.roles = roles


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[TokenData]:
    """
    Valide le token JWT et retourne les données utilisateur.
    Retourne None si aucun token ou si la clé JWT n'est pas configurée.
    """
    if not token or not settings.JWT_SECRET_KEY:
        return None

    try:
        from jose import JWTError, jwt

        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: int = int(payload.get("sub"))
        email: str = payload.get("email", "")
        roles: list = payload.get("roles", [])

        if user_id is None:
            return None

        return TokenData(user_id=user_id, email=email, roles=roles)
    except Exception:
        return None


def require_admin_role(current_user: Optional[TokenData] = Depends(get_current_user)) -> TokenData:
    """
    Dépendance FastAPI : vérifie que l'utilisateur est authentifié et a le rôle Admin.
    Utilisé pour protéger tous les endpoints du service Admin.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise. Connectez-vous avec un compte administrateur.",
        )

    roles = current_user.roles if isinstance(current_user.roles, list) else []
    if "ROLE_ADMIN" not in roles and "ROLE_SUPER_ADMIN" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs.",
        )

    return current_user
