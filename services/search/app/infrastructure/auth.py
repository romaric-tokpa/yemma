"""
Authentification JWT pour le service Search
"""
from typing import Optional
import httpx
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.core.config import settings

security = HTTPBearer()


class TokenData:
    """Données extraites du token JWT"""
    def __init__(self, user_id: int, email: str, roles: list, company_id: Optional[int] = None):
        self.user_id = user_id
        self.email = email
        self.roles = roles
        self.company_id = company_id


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    """
    Valide le token JWT et retourne les données de l'utilisateur
    
    Le token est validé via le service Auth
    """
    token = credentials.credentials
    
    try:
        # Appeler le service Auth pour valider le token
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/v1/auth/validate",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return TokenData(
                    user_id=user_data.get("user_id"),
                    email=user_data.get("email", ""),
                    roles=user_data.get("roles", []),
                    company_id=user_data.get("company_id")
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
    except httpx.RequestError:
        # Fallback: décoder le token localement si le service Auth n'est pas disponible
        try:
            if not settings.JWT_SECRET_KEY:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Auth service unavailable and no JWT_SECRET_KEY configured"
                )
            
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id: int = payload.get("sub")
            email: str = payload.get("email", "")
            roles: list = payload.get("roles", [])
            company_id: Optional[int] = payload.get("company_id")
            
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            
            return TokenData(user_id=user_id, email=email, roles=roles, company_id=company_id)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

