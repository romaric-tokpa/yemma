"""
Modèles du domaine métier (SQLModel)
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship


class UserRole(str, Enum):
    """Rôles utilisateurs"""
    CANDIDATE = "ROLE_CANDIDAT"
    COMPANY_ADMIN = "ROLE_COMPANY_ADMIN"
    RECRUITER = "ROLE_RECRUITER"
    ADMIN = "ROLE_ADMIN"
    SUPER_ADMIN = "ROLE_SUPER_ADMIN"


class UserStatus(str, Enum):
    """Statut de l'utilisateur"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class Role(SQLModel, table=True):
    """Modèle Role"""
    __tablename__ = "roles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=50)
    description: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relations
    user_roles: List["UserRoleLink"] = Relationship(back_populates="role")


class UserRoleLink(SQLModel, table=True):
    """Table de liaison User-Role"""
    __tablename__ = "user_roles"
    
    user_id: int = Field(foreign_key="users.id", primary_key=True)
    role_id: int = Field(foreign_key="roles.id", primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relations
    user: "User" = Relationship(back_populates="user_roles")
    role: Role = Relationship(back_populates="user_roles")


class User(SQLModel, table=True):
    """Modèle User"""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    status: UserStatus = Field(default=UserStatus.PENDING_VERIFICATION)
    is_email_verified: bool = Field(default=False)
    email_verification_token: Optional[str] = Field(default=None, max_length=255)
    password_reset_token: Optional[str] = Field(default=None, max_length=255)
    password_reset_expires: Optional[datetime] = Field(default=None)
    last_login: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    deleted_at: Optional[datetime] = Field(default=None)  # Soft delete
    
    # Relations
    user_roles: List[UserRoleLink] = Relationship(back_populates="user")
    refresh_tokens: List["RefreshToken"] = Relationship(back_populates="user")


class RefreshToken(SQLModel, table=True):
    """Modèle RefreshToken"""
    __tablename__ = "refresh_tokens"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    token: str = Field(unique=True, index=True, max_length=500)
    expires_at: datetime = Field(index=True)
    is_revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relations
    user: User = Relationship(back_populates="refresh_tokens")


class AdminInvitationToken(SQLModel, table=True):
    """Modèle pour les tokens d'invitation d'administrateur"""
    __tablename__ = "admin_invitation_tokens"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(unique=True, index=True, max_length=255)
    email: str = Field(index=True, max_length=255)
    role: str = Field(default="ROLE_ADMIN", max_length=50)  # ROLE_ADMIN ou ROLE_SUPER_ADMIN
    created_by_user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    expires_at: datetime = Field(index=True)
    is_used: bool = Field(default=False, index=True)
    used_at: Optional[datetime] = Field(default=None)
    used_by_user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relations optionnelles
    created_by: Optional[User] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[AdminInvitationToken.created_by_user_id]"}
    )
    used_by: Optional[User] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[AdminInvitationToken.used_by_user_id]"}
    )

