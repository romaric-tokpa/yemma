"""
Schémas Pydantic pour la validation des données
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator


# ============================================
# Authentication Schemas
# ============================================

class Token(BaseModel):
    """Schéma de réponse pour les tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """Données contenues dans le token JWT"""
    user_id: int
    email: str
    roles: List[str] = []


class LoginRequest(BaseModel):
    """Schéma de requête pour la connexion"""
    email: EmailStr
    password: str = Field(..., min_length=8)


class RegisterRequest(BaseModel):
    """Schéma de requête pour l'inscription"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = "ROLE_CANDIDAT"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class RefreshTokenRequest(BaseModel):
    """Schéma de requête pour le refresh token"""
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Schéma de requête pour la réinitialisation de mot de passe"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schéma de confirmation de réinitialisation"""
    token: str
    new_password: str = Field(..., min_length=8)


class PasswordChange(BaseModel):
    """Schéma pour le changement de mot de passe"""
    current_password: str
    new_password: str = Field(..., min_length=8)


# ============================================
# User Schemas
# ============================================

class UserBase(BaseModel):
    """Schéma de base pour User"""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserCreate(UserBase):
    """Schéma pour la création d'un utilisateur"""
    password: str = Field(..., min_length=8)
    role: Optional[str] = "ROLE_CANDIDAT"


class UserUpdate(BaseModel):
    """Schéma pour la mise à jour d'un utilisateur"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    status: Optional[str] = None


class UserResponse(UserBase):
    """Schéma de réponse pour User"""
    id: int
    status: str
    is_email_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    roles: List[str] = []

    class Config:
        from_attributes = True


class UserDetailResponse(UserResponse):
    """Schéma de réponse détaillé pour User"""
    last_login: Optional[datetime] = None


# ============================================
# Role Schemas
# ============================================

class RoleResponse(BaseModel):
    """Schéma de réponse pour Role"""
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

