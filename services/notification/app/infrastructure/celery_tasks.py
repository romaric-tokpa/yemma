"""
Tâches Celery pour l'envoi d'emails
"""
import logging
from typing import Dict, Any
from datetime import datetime
from app.infrastructure.celery_app import celery_app
from app.infrastructure.email_templates import get_email_template
from app.infrastructure.email_sender import EmailSender
from app.infrastructure.database import AsyncSessionLocal
from app.domain.models import NotificationStatus
from app.infrastructure.repositories import NotificationRepository

logger = logging.getLogger(__name__)


@celery_app.task(name="app.infrastructure.celery_tasks.send_notification_task", bind=True, max_retries=3)
def send_notification_task(
    self,
    notification_type: str,
    recipient_email: str,
    recipient_name: str,
    template_data: Dict[str, Any],
    notification_id: int = None
):
    """
    Tâche Celery pour envoyer une notification par email
    
    Args:
        notification_type: Type de notification
        recipient_email: Email du destinataire
        recipient_name: Nom du destinataire
        template_data: Données pour le template
        notification_id: ID de la notification en base (optionnel)
    """
    import asyncio
    
    async def _send():
        try:
            # Récupérer le template
            subject, html_body, text_body = get_email_template(notification_type, {
                "recipient_name": recipient_name,
                **template_data
            })
            
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
                        notification.subject = subject
                        notification.body_html = html_body
                        notification.body_text = text_body
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
                            notification.error_message = str(e)[:1000]  # Limiter à 1000 caractères
                            await notification_repo.update(notification)
                except Exception as db_error:
                    logger.error(f"Error updating notification status: {str(db_error)}")
            
            # Retry avec exponential backoff
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
    
    # Exécuter la fonction async
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_send())

