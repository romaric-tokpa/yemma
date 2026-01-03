"""
Schémas Pydantic pour la validation des données
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

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


class CompanyCreate(CompanyBase):
    """Schéma pour la création d'une entreprise"""
    admin_id: int = Field(..., description="ID du compte maître")


class CompanyUpdate(BaseModel):
    """Schéma pour la mise à jour d'une entreprise"""
    name: Optional[str] = None
    logo_url: Optional[str] = None
    status: Optional[CompanyStatus] = None


class CompanyResponse(CompanyBase):
    """Schéma de réponse pour Company"""
    id: int
    admin_id: int
    status: str
    subscription_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

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


# ============================================
# Invitation Schemas
# ============================================

class InvitationCreate(BaseModel):
    """Schéma pour la création d'une invitation"""
    email: EmailStr = Field(..., description="Email du membre à inviter")
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
    """Schéma pour accepter une invitation"""
    token: str = Field(..., description="Token d'invitation")
    password: str = Field(..., min_length=8, description="Mot de passe pour créer le compte (si compte n'existe pas)")
    first_name: Optional[str] = Field(None, max_length=100, description="Prénom (requis si création de compte)")
    last_name: Optional[str] = Field(None, max_length=100, description="Nom (requis si création de compte)")


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

