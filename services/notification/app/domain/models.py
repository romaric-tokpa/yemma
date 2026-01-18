"""
Modèles SQLModel
"""
from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field


class NotificationStatus(str, Enum):
    """Statut de la notification"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class NotificationType(str, Enum):
    """Type de notification"""
    WELCOME_CANDIDATE = "welcome_candidate"
    PROFILE_VALIDATED = "profile_validated"
    PROFILE_REJECTED = "profile_rejected"
    ACTION_REQUIRED = "action_required"
    RECRUITER_INVITATION = "recruiter_invitation"
    QUOTA_ALERT = "quota_alert"


class Notification(SQLModel, table=True):
    """Modèle Notification"""
    __tablename__ = "notifications"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    notification_type: str = Field(index=True, description="Type de notification")
    recipient_email: str = Field(index=True, max_length=255, description="Email du destinataire")
    recipient_name: Optional[str] = Field(default=None, max_length=255, description="Nom du destinataire")
    subject: Optional[str] = Field(default=None, max_length=500, description="Sujet de l'email")
    body_html: Optional[str] = Field(default=None, description="Corps HTML de l'email")
    body_text: Optional[str] = Field(default=None, description="Corps texte de l'email")
    status: NotificationStatus = Field(default=NotificationStatus.PENDING, description="Statut")
    error_message: Optional[str] = Field(default=None, max_length=1000, description="Message d'erreur si échec")
    sent_at: Optional[datetime] = Field(default=None, description="Date d'envoi")
    template_data: Optional[str] = Field(default=None, description="Données du template JSON")
    notification_metadata: Optional[str] = Field(default=None, description="Métadonnées JSON", sa_column_kwargs={"name": "metadata"})
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


