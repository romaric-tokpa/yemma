"""
Schémas Pydantic pour la validation des données
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.domain.models import CompanyStatus, TeamMemberRole, TeamMemberStatus, InvitationStatus


# ============================================
# Company Schemas
# ============================================

class CompanyBase(BaseModel):
    """Schéma de base pour Company"""
    name: str = Field(..., max_length=255)
    adresse: Optional[str] = Field(None, max_length=500, description="Adresse de l'entreprise")
    legal_id: str = Field(..., max_length=50, description="SIRET ou ID légal")
    logo_url: Optional[str] = None
    # Champs de contact du référent
    contact_first_name: Optional[str] = Field(None, max_length=100, description="Prénom du référent")
    contact_last_name: Optional[str] = Field(None, max_length=100, description="Nom du référent")
    contact_email: Optional[str] = Field(None, max_length=255, description="Email du référent")
    contact_phone: Optional[str] = Field(None, max_length=50, description="Téléphone du référent")
    contact_function: Optional[str] = Field(None, max_length=100, description="Fonction du référent")


class CompanyCreate(CompanyBase):
    """Schéma pour la création d'une entreprise"""
    admin_id: int = Field(..., description="ID du compte maître")


class CompanyUpdate(BaseModel):
    """Schéma pour la mise à jour d'une entreprise"""
    name: Optional[str] = None
    legal_id: Optional[str] = Field(None, max_length=50, description="RCCM/SIRET")
    adresse: Optional[str] = Field(None, max_length=500, description="Adresse de l'entreprise")
    logo_url: Optional[str] = None
    status: Optional[CompanyStatus] = None
    # Champs de contact du référent
    contact_first_name: Optional[str] = Field(None, max_length=100, description="Prénom du référent")
    contact_last_name: Optional[str] = Field(None, max_length=100, description="Nom du référent")
    contact_email: Optional[str] = Field(None, max_length=255, description="Email du référent")
    contact_phone: Optional[str] = Field(None, max_length=50, description="Téléphone du référent")
    contact_function: Optional[str] = Field(None, max_length=100, description="Fonction du référent")


class CompanyResponse(CompanyBase):
    """Schéma de réponse pour Company"""
    id: int
    admin_id: int
    status: str
    subscription_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_validator("status", mode="before")
    @classmethod
    def status_to_str(cls, v: Any) -> str:
        """Convertit CompanyStatus enum en str pour la sérialisation"""
        if isinstance(v, CompanyStatus):
            return v.value
        return str(v) if v is not None else "active"

    class Config:
        from_attributes = True


class CompanyDetailResponse(CompanyResponse):
    """Schéma de réponse détaillé pour Company"""
    team_members_count: int = 0
    active_team_members_count: int = 0


# ============================================
# Recruiter Schemas
# ============================================

class RecruiterBase(BaseModel):
    """Schéma de base pour Recruiter"""
    user_id: int
    company_id: int


class RecruiterCreate(RecruiterBase):
    """Schéma pour la création d'un recruteur"""
    pass


class TeamMemberBase(BaseModel):
    """Schéma de base pour TeamMember"""
    user_id: int
    company_id: int
    role_in_company: TeamMemberRole
    status: TeamMemberStatus


class TeamMemberResponse(TeamMemberBase):
    """Schéma de réponse pour TeamMember"""
    id: int
    role_in_company: TeamMemberRole
    status: TeamMemberStatus
    joined_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TeamMemberDetailResponse(TeamMemberResponse):
    """Schéma de réponse détaillé pour TeamMember"""
    company_name: Optional[str] = None
    user_email: Optional[str] = None


# Alias pour compatibilité avec le code existant
# TODO: Migrer progressivement vers TeamMemberResponse
RecruiterResponse = TeamMemberResponse
RecruiterDetailResponse = TeamMemberDetailResponse


class TeamMemberOrInvitationResponse(BaseModel):
    """Schéma unifié pour TeamMember ou Invitation (pour l'affichage dans la section équipe)"""
    id: int
    type: str = Field(..., description="Type: 'member' ou 'invitation'")
    email: str = Field(..., description="Email du membre ou de l'invité")
    first_name: Optional[str] = Field(None, description="Prénom du membre ou de l'invité")
    last_name: Optional[str] = Field(None, description="Nom du membre ou de l'invité")
    role_in_company: TeamMemberRole
    status: str = Field(..., description="Status du membre ou de l'invitation")
    joined_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_id: Optional[int] = None  # Pour les TeamMember
    invitation_id: Optional[int] = None  # Pour les Invitation
    expires_at: Optional[datetime] = None  # Pour les Invitation

    class Config:
        from_attributes = True


# ============================================
# Invitation Schemas
# ============================================

class InvitationCreate(BaseModel):
    """Schéma pour la création d'une invitation et du compte recruteur"""
    email: EmailStr = Field(..., description="Email du membre à inviter")
    first_name: str = Field(..., min_length=1, max_length=100, description="Prénom du recruteur")
    last_name: str = Field(..., min_length=1, max_length=100, description="Nom du recruteur")
    password: str = Field(..., min_length=8, description="Mot de passe temporaire pour le compte")
    # company_id sera automatiquement récupéré depuis get_current_company


class InvitationResponse(BaseModel):
    """Schéma de réponse pour Invitation"""
    id: int
    company_id: int
    email: str
    token: str
    role: TeamMemberRole
    status: str
    expires_at: datetime
    invited_by: int
    created_at: datetime
    accepted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvitationAcceptRequest(BaseModel):
    """Schéma pour accepter une invitation et créer le compte"""
    token: str = Field(..., description="Token d'invitation")
    password: str = Field(..., min_length=8, description="Mot de passe pour créer le compte")
    first_name: str = Field(..., min_length=1, max_length=100, description="Prénom")
    last_name: str = Field(..., min_length=1, max_length=100, description="Nom")


# ============================================
# Search Schemas (pour les recruteurs)
# ============================================

class CandidateSearchRequest(BaseModel):
    """Schéma de requête de recherche pour recruteurs"""
    query: Optional[str] = None
    sectors: Optional[List[str]] = None
    main_jobs: Optional[List[str]] = None
    min_experience: Optional[int] = None
    max_experience: Optional[int] = None
    min_admin_score: Optional[float] = None
    skills: Optional[List[str]] = None
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)

