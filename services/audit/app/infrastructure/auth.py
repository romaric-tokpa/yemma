"""
Gestion de l'authentification et validation des tokens JWT
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import httpx

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


class TokenData:
    """Données contenues dans le token JWT"""
    def __init__(self, user_id: int, email: str, roles: list):
        self.user_id = user_id
        self.email = email
        self.roles = roles


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[TokenData]:
    """
    Récupère l'utilisateur actuel depuis le token JWT
    
    Retourne None si aucun token n'est fourni (pour permettre les appels inter-services)
    """
    if not token:
        return None
    
    try:
        # Tenter de valider le token via le Auth Service
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/v1/users/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            response.raise_for_status()
            user_data = response.json()
            
            return TokenData(
                user_id=user_data["id"],
                email=user_data["email"],
                roles=[role["name"] for role in user_data.get("roles", [])]
            )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            # Si le Auth Service renvoie 401, tenter de décoder localement
            try:
                payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
                user_id: int = payload.get("sub")
                email: str = payload.get("email")
                roles: list[str] = payload.get("roles", [])
                
                if user_id is None or email is None:
                    return None
                return TokenData(user_id=user_id, email=email, roles=roles)
            except JWTError:
                return None
        else:
            # Autres erreurs du Auth Service
            return None
    except httpx.RequestError:
        # Si le Auth Service est injoignable, tenter de décoder localement
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id: int = payload.get("sub")
            email: str = payload.get("email")
            roles: list[str] = payload.get("roles", [])
            
            if user_id is None or email is None:
                return None
            return TokenData(user_id=user_id, email=email, roles=roles)
        except JWTError:
            return None


def require_candidate_access(candidate_id: int):
    """
    Factory pour créer une dépendance qui vérifie qu'un candidat peut accéder à ses propres données
    
    Args:
        candidate_id: ID du candidat dont on veut voir les logs
    
    Returns:
        Dépendance FastAPI qui vérifie les permissions
    """
    async def _check_access(
        current_user: Optional[TokenData] = Depends(get_current_user)
    ) -> TokenData:
        """
        Vérifie que l'utilisateur peut accéder aux logs du candidat
        
        Returns:
            TokenData: Données de l'utilisateur authentifié
        
        Raises:
            HTTPException: Si l'utilisateur n'est pas authentifié ou n'a pas le droit
        """
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Vérifier que l'utilisateur est bien le candidat concerné
        # OU qu'il est admin
        if current_user.user_id != candidate_id and "ROLE_ADMIN" not in current_user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own access logs"
            )
        
        return current_user
    
    return _check_access

