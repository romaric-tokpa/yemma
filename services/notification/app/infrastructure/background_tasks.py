"""
Tâches asynchrones pour l'envoi d'emails
"""
import logging
from typing import Dict, Any
from app.infrastructure.email_templates_simple import get_email_template_simple
from app.infrastructure.email_templates import get_email_template as get_email_template_legacy
from app.infrastructure.email_sender import EmailSender
from app.infrastructure.database import AsyncSessionLocal
from app.domain.models import Notification, NotificationStatus
from app.infrastructure.repositories import NotificationRepository
from datetime import datetime

logger = logging.getLogger(__name__)


async def send_notification_task(
    notification_type: str,
    recipient_email: str,
    recipient_name: str,
    template_data: Dict[str, Any],
    notification_id: int = None
):
    """
    Tâche asynchrone pour envoyer une notification par email
    
    Args:
        notification_type: Type de notification
        recipient_email: Email du destinataire
        recipient_name: Nom du destinataire
        template_data: Données pour le template
        notification_id: ID de la notification en base (optionnel)
    """
    logger.debug("send_notification_task start: type=%s to=%s", notification_type, recipient_email)
    
    try:
        # Récupérer le template (utilise les templates simples pour les 3 types principaux)
        template_data_with_name = {
            "recipient_name": recipient_name,
            **template_data
        }
        
        # Utiliser les templates simples (charte graphique) pour ces types
        if notification_type in [
            "password_reset",
            "profile_validated",
            "profile_rejected",
            "recruiter_invitation",
            "candidate_account_created",
            "candidate_profile_created",
            "candidate_welcome",
            "company_account_created",
            "company_onboarding_completed",
            "company_welcome",
            "admin_validation_request",
        ]:
            subject, html_body, text_body = get_email_template_simple(notification_type, template_data_with_name)
        else:
            subject, html_body, text_body = get_email_template_legacy(notification_type, template_data_with_name)
        
        # Envoyer l'email
        success = await EmailSender.send_email(
            to_email=recipient_email,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            to_name=recipient_name
        )
        
        # Mettre à jour le statut de la notification en base
        if notification_id:
            async with AsyncSessionLocal() as session:
                notification_repo = NotificationRepository(session)
                notification = await notification_repo.get_by_id(notification_id)
                if notification:
                    notification.status = NotificationStatus.SENT if success else NotificationStatus.FAILED
                    notification.sent_at = datetime.utcnow() if success else None
                    await notification_repo.update(notification)
        
        if success:
            logger.info(f"Notification {notification_type} sent successfully to {recipient_email}")
        else:
            logger.error(f"Failed to send notification {notification_type} to {recipient_email}")
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending notification {notification_type} to {recipient_email}: {str(e)}")
        
        # Marquer la notification comme échouée
        if notification_id:
            try:
                async with AsyncSessionLocal() as session:
                    notification_repo = NotificationRepository(session)
                    notification = await notification_repo.get_by_id(notification_id)
                    if notification:
                        notification.status = NotificationStatus.FAILED
                        await notification_repo.update(notification)
            except Exception as db_error:
                logger.error(f"Error updating notification status: {str(db_error)}")
        
        # Ne pas relancer l'exception : la réponse HTTP 202 a déjà été envoyée,
        # une exception ici provoquerait "RuntimeError: Caught handled exception, but response already started"

