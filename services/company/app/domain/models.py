"""
Modèles du domaine métier (SQLModel)
"""
from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship


class CompanyStatus(str, Enum):
    """Statut de l'entreprise"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class TeamMemberRole(str, Enum):
    """Rôle dans l'entreprise"""
    ADMIN_ENTREPRISE = "ADMIN_ENTREPRISE"
    RECRUTEUR = "RECRUTEUR"


class TeamMemberStatus(str, Enum):
    """Statut du membre d'équipe"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"  # En attente d'acceptation de l'invitation


class InvitationStatus(str, Enum):
    """Statut de l'invitation"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Company(SQLModel, table=True):
    """Modèle Company"""
    __tablename__ = "companies"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, index=True, description="Nom de l'entreprise")
    adresse: Optional[str] = Field(default=None, max_length=500, description="Adresse de l'entreprise")
    legal_id: str = Field(unique=True, index=True, max_length=50, description="SIRET ou ID légal")
    logo_url: Optional[str] = Field(default=None, max_length=500, description="URL du logo")
    admin_id: int = Field(index=True, description="ID du compte maître (admin) - Référence vers users dans auth-service, sans contrainte FK")
    status: CompanyStatus = Field(default=CompanyStatus.ACTIVE, description="Statut de l'entreprise")
    subscription_id: Optional[int] = Field(default=None, description="ID de l'abonnement")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    deleted_at: Optional[datetime] = Field(default=None)  # Soft delete
    
    # Relations
    team_members: list["TeamMember"] = Relationship(back_populates="company")
    invitations: list["Invitation"] = Relationship(back_populates="company")


class TeamMember(SQLModel, table=True):
    """Modèle TeamMember - Lien entre un User et une Company"""
    __tablename__ = "team_members"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, description="ID utilisateur (auth-service) - Référence vers users dans auth-service, sans contrainte FK")
    company_id: int = Field(foreign_key="companies.id", index=True, description="ID de l'entreprise")
    role_in_company: TeamMemberRole = Field(default=TeamMemberRole.RECRUTEUR, description="Rôle dans l'entreprise")
    status: TeamMemberStatus = Field(default=TeamMemberStatus.PENDING, description="Statut du membre")
    joined_at: Optional[datetime] = Field(default=None, description="Date d'acceptation de l'invitation")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    deleted_at: Optional[datetime] = Field(default=None)  # Soft delete
    
    # Relations
    company: Company = Relationship(back_populates="team_members")
    
    # Contrainte unique : un utilisateur ne peut être membre que d'une seule entreprise
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class Invitation(SQLModel, table=True):
    """Modèle Invitation"""
    __tablename__ = "invitations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id", index=True, description="ID de l'entreprise")
    email: str = Field(index=True, max_length=255, description="Email invité")
    token: str = Field(unique=True, index=True, max_length=255, description="Token d'invitation unique")
    role: TeamMemberRole = Field(default=TeamMemberRole.RECRUTEUR, description="Rôle assigné (RECRUTEUR par défaut)")
    status: InvitationStatus = Field(default=InvitationStatus.PENDING, description="Statut de l'invitation")
    expires_at: datetime = Field(index=True, description="Date d'expiration")
    invited_by: int = Field(description="ID de l'utilisateur qui a envoyé l'invitation - Référence vers users dans auth-service, sans contrainte FK")
    accepted_at: Optional[datetime] = Field(default=None, description="Date d'acceptation")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relations
    company: Company = Relationship(back_populates="invitations")


# Alias pour compatibilité avec le code existant
# TODO: Migrer progressivement vers TeamMember
Recruiter = TeamMember

