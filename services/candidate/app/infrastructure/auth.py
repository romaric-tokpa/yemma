"""
Validation JWT et authentification
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

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
        roles: list = payload.get("roles", [])
        
        if user_id is None or email is None:
            return None
        
        return TokenData(user_id=user_id, email=email, roles=roles)
    except (JWTError, ValueError, TypeError):
        return None

