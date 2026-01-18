"""
Gestion de l'authentification et validation des tokens JWT
"""
from typing import Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import PermissionDeniedError

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.AUTH_SERVICE_URL}/api/v1/auth/login",
    scheme_name="JWT"
)


class TokenData:
    """Données contenues dans le token JWT"""
    def __init__(self, user_id: int, email: str, roles: list):
        self.user_id = user_id
        self.email = email
        self.roles = roles


def decode_token(token: str) -> Dict[str, Any]:
    """Décode un token JWT"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """Dependency pour obtenir l'utilisateur actuel depuis le token"""
    payload = decode_token(token)
    
    # Le JWT "sub" est généralement une string, on doit le convertir en int
    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing 'sub'"
        )
    
    # Convertir sub en int si c'est une string
    try:
        user_id: int = int(sub) if isinstance(sub, str) else sub
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token payload: 'sub' must be a valid integer, got {type(sub)}"
        )
    
    email: str = payload.get("email")
    roles: list = payload.get("roles", [])
    
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing 'email'"
        )
    
    return TokenData(user_id=user_id, email=email, roles=roles)

