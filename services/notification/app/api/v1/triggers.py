"""
Endpoints internes pour les triggers de notification
Ces endpoints sont appelés par les autres services de la plateforme
"""
from typing import Dict, Any
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.infrastructure.database import get_session
from app.infrastructure.background_tasks import send_notification_task
from app.core.config import settings
from app.infrastructure.repositories import NotificationRepository
from app.domain.models import Notification, NotificationStatus
import json
from datetime import datetime

# Importer la vérification du token interne
import sys
import os
shared_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "shared")
if shared_path not in sys.path:
    sys.path.insert(0, shared_path)

try:
    from services.shared.internal_auth import verify_internal_token
except ImportError:
    # Fallback si le module shared n'existe pas
    from fastapi import Security, Header
    async def verify_internal_token(x_service_token: str = Header(None, alias="X-Service-Token")):
        """Vérification basique du token interne"""
        if not x_service_token:
            raise HTTPException(status_code=401, detail="Missing X-Service-Token")
        return {"service": "internal"}

router = APIRouter()


class ValidationNotificationRequest(BaseModel):
    """Requête pour notifier une validation de profil"""
    candidate_email: str = Field(..., description="Email du candidat")
    candidate_name: str = Field(..., description="Nom du candidat")
    profile_url: str = Field(default="", description="URL du profil candidat")


class RejectionNotificationRequest(BaseModel):
    """Requête pour notifier un rejet de profil"""
    candidate_email: str = Field(..., description="Email du candidat")
    candidate_name: str = Field(..., description="Nom du candidat")
    rejection_reason: str = Field(..., description="Motif du rejet")
    profile_url: str = Field(default="", description="URL du profil candidat")


class InvitationNotificationRequest(BaseModel):
    """Requête pour notifier une invitation de recruteur"""
    recipient_email: str = Field(..., description="Email du recruteur invité")
    recipient_name: str = Field(..., description="Nom du recruteur")
    company_name: str = Field(..., description="Nom de l'entreprise")
    invitation_token: str = Field(..., description="Token d'invitation")
    invitation_url: str = Field(default="", description="URL d'acceptation de l'invitation")


@router.post("/notify_validation", status_code=status.HTTP_202_ACCEPTED)
async def notify_validation(
    request: ValidationNotificationRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email de félicitations au candidat quand son profil est VALIDATED
    
    Appelé par le Admin Service après validation d'un profil.
    """
    try:
        # Créer l'enregistrement de notification
        notification_repo = NotificationRepository(session)
        
        template_data = {
            "candidate_name": request.candidate_name,
            "profile_url": request.profile_url or f"{settings.FRONTEND_URL}/candidate/profile"
        }
        
        notification = Notification(
            notification_type="profile_validated",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        
        notification = await notification_repo.create(notification)
        
        # Ajouter la tâche d'envoi en arrière-plan
        background_tasks.add_task(
            send_notification_task,
            notification_type="profile_validated",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=template_data,
            notification_id=notification.id
        )
        
        return {
            "message": "Validation notification queued",
            "notification_id": notification.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue validation notification: {str(e)}"
        )


@router.post("/notify_rejection", status_code=status.HTTP_202_ACCEPTED)
async def notify_rejection(
    request: RejectionNotificationRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email au candidat avec le motif du refus quand le statut est REJECTED
    
    Appelé par le Admin Service après rejet d'un profil.
    """
    try:
        # Créer l'enregistrement de notification
        notification_repo = NotificationRepository(session)
        
        template_data = {
            "candidate_name": request.candidate_name,
            "rejection_reason": request.rejection_reason,
            "profile_url": request.profile_url or f"{settings.FRONTEND_URL}/candidate/profile"
        }
        
        notification = Notification(
            notification_type="profile_rejected",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        
        notification = await notification_repo.create(notification)
        
        # Ajouter la tâche d'envoi en arrière-plan
        background_tasks.add_task(
            send_notification_task,
            notification_type="profile_rejected",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=template_data,
            notification_id=notification.id
        )
        
        return {
            "message": "Rejection notification queued",
            "notification_id": notification.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue rejection notification: {str(e)}"
        )


@router.post("/notify_invitation", status_code=status.HTTP_202_ACCEPTED)
async def notify_invitation(
    request: InvitationNotificationRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email avec un lien magique (token) lorsqu'un Admin d'Entreprise invite un nouveau recruteur
    
    Appelé par le Company Service lors de l'invitation d'un recruteur.
    """
    try:
        # Créer l'enregistrement de notification
        notification_repo = NotificationRepository(session)
        
        invitation_url = request.invitation_url or f"{settings.FRONTEND_URL}/invitation/accept?token={request.invitation_token}"
        
        template_data = {
            "company_name": request.company_name,
            "invitation_token": request.invitation_token,
            "invitation_url": invitation_url
        }
        
        notification = Notification(
            notification_type="recruiter_invitation",
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        
        notification = await notification_repo.create(notification)
        
        # Ajouter la tâche d'envoi en arrière-plan
        background_tasks.add_task(
            send_notification_task,
            notification_type="recruiter_invitation",
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            template_data=template_data,
            notification_id=notification.id
        )
        
        return {
            "message": "Invitation notification queued",
            "notification_id": notification.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue invitation notification: {str(e)}"
        )

