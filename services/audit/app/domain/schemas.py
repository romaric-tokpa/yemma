"""
Schémas Pydantic pour la validation des données
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, EmailStr


class AccessLogCreate(BaseModel):
    """Schéma pour créer un log d'accès"""
    recruiter_id: int = Field(description="ID du recruteur")
    recruiter_email: EmailStr = Field(description="Email du recruteur")
    recruiter_name: Optional[str] = Field(default=None, description="Nom du recruteur")
    company_id: int = Field(description="ID de l'entreprise")
    company_name: Optional[str] = Field(default=None, description="Nom de l'entreprise")
    candidate_id: int = Field(description="ID du candidat")
    candidate_email: Optional[EmailStr] = Field(default=None, description="Email du candidat")
    candidate_name: Optional[str] = Field(default=None, description="Nom du candidat")
    access_type: str = Field(default="profile_view", description="Type d'accès")
    action_type: str = Field(default="VIEW_PROFILE", description="Type d'action (VIEW_PROFILE, DOWNLOAD_CV)")
    ip_address: Optional[str] = Field(default=None, description="Adresse IP")
    user_agent: Optional[str] = Field(default=None, description="User Agent")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Métadonnées supplémentaires")


class AccessLogResponse(BaseModel):
    """Schéma de réponse pour AccessLog"""
    id: int
    recruiter_id: int
    recruiter_email: str
    recruiter_name: Optional[str] = None
    company_id: int
    company_name: Optional[str] = None
    candidate_id: int
    candidate_email: Optional[str] = None
    candidate_name: Optional[str] = None
    accessed_at: datetime
    access_type: str
    action_type: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AccessLogListResponse(BaseModel):
    """Schéma de réponse pour une liste de logs"""
    total: int
    items: List[AccessLogResponse]


class AccessLogStatsResponse(BaseModel):
    """Schéma de réponse pour les statistiques d'accès"""
    total_accesses: int
    unique_recruiters: int
    unique_candidates: int
    accesses_by_date: Dict[str, int]
    accesses_by_company: Dict[str, int]


class CompanyAccessSummary(BaseModel):
    """Schéma pour résumer les accès par entreprise (RGPD)"""
    company_id: int
    company_name: Optional[str] = None
    access_count: int
    last_access: datetime


class CandidateAccessSummaryResponse(BaseModel):
    """Schéma de réponse pour le résumé des accès d'un candidat (RGPD)"""
    candidate_id: int
    total_accesses: int
    unique_companies: int
    companies: List[CompanyAccessSummary]


