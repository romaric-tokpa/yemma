"""
Modèles SQLModel pour l'audit
"""
from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field


class ActionType(str, Enum):
    """Types d'actions enregistrées dans les logs"""
    VIEW_PROFILE = "VIEW_PROFILE"
    DOWNLOAD_CV = "DOWNLOAD_CV"


class AccessLog(SQLModel, table=True):
    """
    Modèle AccessLog - Logs d'accès aux profils candidats (RGPD)
    
    Enregistre : Qui, Quand, Quel profil
    """
    __tablename__ = "access_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Qui : Informations sur le recruteur
    recruiter_id: int = Field(index=True, description="ID du recruteur")
    recruiter_email: str = Field(index=True, max_length=255, description="Email du recruteur")
    recruiter_name: Optional[str] = Field(default=None, max_length=255, description="Nom du recruteur")
    company_id: int = Field(index=True, description="ID de l'entreprise")
    company_name: Optional[str] = Field(default=None, max_length=255, description="Nom de l'entreprise")
    
    # Quel profil : Informations sur le candidat consulté
    candidate_id: int = Field(index=True, description="ID du candidat")
    candidate_email: Optional[str] = Field(default=None, max_length=255, description="Email du candidat")
    candidate_name: Optional[str] = Field(default=None, max_length=255, description="Nom du candidat")
    
    # Quand : Informations temporelles
    accessed_at: datetime = Field(default_factory=datetime.utcnow, index=True, description="Date et heure d'accès")
    
    # Contexte de l'accès
    access_type: str = Field(default="profile_view", max_length=50, description="Type d'accès (profile_view, document_view, etc.)")
    action_type: str = Field(default=ActionType.VIEW_PROFILE.value, max_length=50, description="Type d'action (VIEW_PROFILE, DOWNLOAD_CV)")
    ip_address: Optional[str] = Field(default=None, max_length=45, description="Adresse IP")
    user_agent: Optional[str] = Field(default=None, max_length=500, description="User Agent")
    
    # Métadonnées supplémentaires
    metadata: Optional[str] = Field(default=None, description="Métadonnées JSON supplémentaires")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


