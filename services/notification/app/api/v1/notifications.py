"""
Endpoints de notification
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, BackgroundTasks, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.domain.schemas import (
    NotificationResponse,
    SendNotificationRequest,
)
from app.domain.models import Notification, NotificationStatus
from app.infrastructure.database import get_session
from app.infrastructure.repositories import NotificationRepository
from app.infrastructure.background_tasks import send_notification_task
from app.core.config import settings
from app.core.exceptions import NotificationError

router = APIRouter()

# Importer Celery si configuré
celery_send_notification_task = None
if settings.TASK_QUEUE == "celery":
    try:
        from app.infrastructure.celery_tasks import send_notification_task as celery_send_notification_task
    except ImportError:
        celery_send_notification_task = None


@router.post("/send", response_model=NotificationResponse, status_code=status.HTTP_202_ACCEPTED)
async def send_notification(
    request: SendNotificationRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session)
):
    """
    Envoie une notification de manière asynchrone
    
    Les types de notifications supportés :
    - welcome_candidate : Bienvenue (Candidat)
    - profile_validated : Profil Validé (Candidat)
    - profile_rejected : Profil Refusé (Candidat)
    - recruiter_invitation : Nouvelle invitation d'équipe (Recruteur)
    - quota_alert : Alerte de quota d'abonnement atteint (Entreprise)
    """
    # Créer l'enregistrement de notification en base
    notification_repo = NotificationRepository(session)
    
    import json
    notification = Notification(
        notification_type=request.notification_type,
        recipient_email=request.recipient_email,
        recipient_name=request.recipient_name or request.recipient_email,
        template_data=json.dumps(request.template_data) if request.template_data else None,
        status=NotificationStatus.PENDING,
    )
    
    notification = await notification_repo.create(notification)
    
    # Ajouter la tâche d'envoi en arrière-plan (BackgroundTasks ou Celery)
    if settings.TASK_QUEUE == "celery" and celery_send_notification_task:
        # Utiliser Celery
        celery_send_notification_task.delay(
            notification_type=request.notification_type,
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name or request.recipient_email,
            template_data=request.template_data or {},
            notification_id=notification.id
        )
    else:
        # Utiliser BackgroundTasks FastAPI
        background_tasks.add_task(
            send_notification_task,
            notification_type=request.notification_type,
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name or request.recipient_email,
            template_data=request.template_data or {},
            notification_id=notification.id
        )
    
    return NotificationResponse.model_validate(notification)


@router.post("/send/welcome-candidate", status_code=status.HTTP_202_ACCEPTED)
async def send_welcome_candidate(
    recipient_email: str,
    recipient_name: str,
    template_data: Dict[str, Any] = None,
    background_tasks: BackgroundTasks = None,
    session: AsyncSession = Depends(get_session)
):
    """
    Envoie un email de bienvenue à un candidat
    """
    return await send_notification(
        SendNotificationRequest(
            notification_type="welcome_candidate",
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            template_data=template_data or {}
        ),
        background_tasks,
        session
    )


@router.post("/send/profile-validated", status_code=status.HTTP_202_ACCEPTED)
async def send_profile_validated(
    recipient_email: str,
    recipient_name: str,
    template_data: Dict[str, Any],
    background_tasks: BackgroundTasks = None,
    session: AsyncSession = Depends(get_session)
):
    """
    Envoie un email de profil validé à un candidat
    """
    return await send_notification(
        SendNotificationRequest(
            notification_type="profile_validated",
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            template_data=template_data
        ),
        background_tasks,
        session
    )


@router.post("/send/profile-rejected", status_code=status.HTTP_202_ACCEPTED)
async def send_profile_rejected(
    recipient_email: str,
    recipient_name: str,
    template_data: Dict[str, Any],
    background_tasks: BackgroundTasks = None,
    session: AsyncSession = Depends(get_session)
):
    """
    Envoie un email de profil refusé à un candidat
    """
    return await send_notification(
        SendNotificationRequest(
            notification_type="profile_rejected",
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            template_data=template_data
        ),
        background_tasks,
        session
    )


@router.post("/send/recruiter-invitation", status_code=status.HTTP_202_ACCEPTED)
async def send_recruiter_invitation(
    recipient_email: str,
    recipient_name: str,
    template_data: Dict[str, Any],
    background_tasks: BackgroundTasks = None,
    session: AsyncSession = Depends(get_session)
):
    """
    Envoie un email d'invitation à un recruteur
    """
    return await send_notification(
        SendNotificationRequest(
            notification_type="recruiter_invitation",
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            template_data=template_data
        ),
        background_tasks,
        session
    )


@router.post("/send/quota-alert", status_code=status.HTTP_202_ACCEPTED)
async def send_quota_alert(
    recipient_email: str,
    recipient_name: str,
    template_data: Dict[str, Any],
    background_tasks: BackgroundTasks = None,
    session: AsyncSession = Depends(get_session)
):
    """
    Envoie une alerte de quota atteint à une entreprise
    """
    return await send_notification(
        SendNotificationRequest(
            notification_type="quota_alert",
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            template_data=template_data
        ),
        background_tasks,
        session
    )


@router.get("/validation-requests", response_model=list[NotificationResponse])
async def get_validation_requests(
    limit: int = 20,
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère les demandes de validation de profil envoyées par les candidats.
    Utilisé par le dashboard admin pour afficher les notifications.
    """
    notification_repo = NotificationRepository(session)
    notifications = await notification_repo.get_by_type("admin_validation_request", limit)
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère une notification par ID
    """
    notification_repo = NotificationRepository(session)
    notification = await notification_repo.get_by_id(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return NotificationResponse.model_validate(notification)


@router.get("/recipient/{email}", response_model=list[NotificationResponse])
async def get_notifications_by_recipient(
    email: str,
    limit: int = 50,
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère les notifications d'un destinataire
    """
    notification_repo = NotificationRepository(session)
    notifications = await notification_repo.get_by_recipient_email(email, limit)
    
    return [NotificationResponse.model_validate(n) for n in notifications]
