"""
Schémas Pydantic pour la validation des données
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

from app.domain.models import NotificationType


class NotificationRequest(BaseModel):
    """Schéma pour créer une notification"""
    notification_type: NotificationType = Field(description="Type de notification")
    recipient_email: EmailStr = Field(description="Email du destinataire")
    recipient_name: Optional[str] = Field(default=None, description="Nom du destinataire")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Métadonnées pour le template")


class NotificationResponse(BaseModel):
    """Schéma de réponse pour Notification"""
    id: int
    notification_type: str
    recipient_email: str
    recipient_name: Optional[str] = None
    subject: Optional[str] = None
    template_data: Optional[str] = None
    status: str
    sent_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


# Schémas spécifiques pour chaque type de notification
class ProfileValidatedNotification(BaseModel):
    """Notification : Profil validé"""
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    candidate_name: str = Field(description="Nom du candidat")
    profile_url: Optional[str] = Field(default=None, description="URL du profil")


class ActionRequiredNotification(BaseModel):
    """Notification : Action requise sur votre profil"""
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    candidate_name: str = Field(description="Nom du candidat")
    action_message: str = Field(description="Message d'action requise")
    profile_url: Optional[str] = Field(default=None, description="URL du profil")


class RecruiterInvitationNotification(BaseModel):
    """Notification : Nouvelle invitation recruteur"""
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    company_name: str = Field(description="Nom de l'entreprise")
    invitation_token: str = Field(description="Token d'invitation")
    invitation_url: Optional[str] = Field(default=None, description="URL d'invitation")


class SendNotificationRequest(BaseModel):
    """Schéma pour envoyer une notification"""
    notification_type: str = Field(description="Type de notification")
    recipient_email: EmailStr = Field(description="Email du destinataire")
    recipient_name: Optional[str] = Field(default=None, description="Nom du destinataire")
    template_data: Optional[Dict[str, Any]] = Field(default=None, description="Données pour le template")


