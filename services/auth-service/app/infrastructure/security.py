"""
Gestion de la sécurité : JWT, OAuth2, Hashing
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.domain.schemas import TokenData
from app.domain.exceptions import TokenError, InvalidCredentialsError

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=settings.OAUTH2_TOKEN_URL,
    scheme_name="JWT"
)


def hash_password(password: str) -> str:
    """Hash un mot de passe"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Crée un token JWT d'accès"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Crée un token JWT de rafraîchissement"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


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
        raise TokenError(f"Invalid token: {str(e)}")


def get_token_data(token: str) -> TokenData:
    """Extrait les données d'un token"""
    payload = decode_token(token)
    
    user_id: int = payload.get("sub")
    email: str = payload.get("email")
    roles: list = payload.get("roles", [])
    
    if user_id is None or email is None:
        raise TokenError("Invalid token payload")
    
    return TokenData(user_id=user_id, email=email, roles=roles)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """Dependency pour obtenir l'utilisateur actuel depuis le token"""
    try:
        token_data = get_token_data(token)
        return token_data
    except TokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(required_role: str):
    """Dependency factory pour vérifier un rôle spécifique"""
    async def role_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if required_role not in current_user.roles:
            from app.domain.exceptions import PermissionDeniedError
            raise PermissionDeniedError(required_role)
        return current_user
    
    return role_checker

