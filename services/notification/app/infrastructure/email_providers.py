"""
Providers d'envoi d'emails (FastAPI-Mail, Mock, etc.)
"""
import logging
from typing import Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
from app.core.exceptions import EmailError

logger = logging.getLogger(__name__)


class FastAPIMailProvider:
    """Provider FastAPI-Mail pour l'envoi d'emails"""
    
    def __init__(self):
        # Format MAIL_FROM: "Name <email@example.com>" ou simplement l'email
        mail_from = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>" if settings.SMTP_FROM_NAME else settings.SMTP_FROM_EMAIL
        
        # Log de la configuration (sans afficher le mot de passe complet)
        logger.info(f"Initializing FastAPI-Mail with SMTP_HOST={settings.SMTP_HOST}, SMTP_PORT={settings.SMTP_PORT}, SMTP_USER={settings.SMTP_USER}, SMTP_FROM={mail_from}")
        logger.debug(f"SMTP_PASSWORD length: {len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else 0}")
        
        self.config = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USER,
            MAIL_PASSWORD=settings.SMTP_PASSWORD,
            MAIL_FROM=mail_from,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=settings.SMTP_HOST,
            MAIL_STARTTLS=settings.SMTP_USE_TLS,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )
        self.fastmail = FastMail(self.config)
        logger.info("FastAPI-Mail provider initialized successfully")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None
    ) -> bool:
        """Envoie un email via FastAPI-Mail"""
        try:
            logger.info(f"Attempting to send email via FastAPI-Mail to {to_email} with subject: {subject}")
            
            message = MessageSchema(
                subject=subject,
                recipients=[to_email],
                body=html_body,
                subtype=MessageType.html,
            )
            
            if text_body:
                # FastAPI-Mail gère automatiquement le texte alternatif
                pass
            
            logger.debug(f"Sending message to {to_email}...")
            await self.fastmail.send_message(message)
            logger.info(f"✅ Email sent successfully via FastAPI-Mail to {to_email}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send email via FastAPI-Mail to {to_email}: {str(e)}", exc_info=True)
            raise EmailError(f"Failed to send email via FastAPI-Mail: {str(e)}")


class MockEmailProvider:
    """Provider Mock pour les tests et le développement"""
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None
    ) -> bool:
        """Simule l'envoi d'email (log uniquement)"""
        try:
            logger.info("=" * 80)
            logger.info(f"📧 MOCK EMAIL - To: {to_email} ({to_name or 'N/A'})")
            logger.info(f"📧 Subject: {subject}")
            logger.info(f"📧 HTML Body Length: {len(html_body)} characters")
            if text_body:
                logger.info(f"📧 Text Body Length: {len(text_body)} characters")
            logger.info("=" * 80)
            
            # En développement, on peut aussi sauvegarder dans un fichier
            if settings.DEBUG:
                import os
                from datetime import datetime
                
                mock_dir = "/tmp/yemma_emails"
                os.makedirs(mock_dir, exist_ok=True)
                
                timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                filename = f"{mock_dir}/email_{timestamp}_{to_email.replace('@', '_at_')}.html"
                
                with open(filename, "w", encoding="utf-8") as f:
                    f.write(f"<h2>Email Mock - {subject}</h2>")
                    f.write(f"<p><strong>To:</strong> {to_email} ({to_name or 'N/A'})</p>")
                    f.write(f"<p><strong>Subject:</strong> {subject}</p>")
                    f.write(f"<hr>")
                    f.write(html_body)
                
                logger.info(f"📧 Mock email saved to: {filename}")
            
            return True
        except Exception as e:
            logger.error(f"Error in mock email provider: {str(e)}")
            raise EmailError(f"Error in mock email provider: {str(e)}")


def get_email_provider():
    """Retourne le provider d'email configuré"""
    provider_name = settings.EMAIL_PROVIDER.lower()
    logger.info(f"Getting email provider: {provider_name} (from EMAIL_PROVIDER={settings.EMAIL_PROVIDER})")
    
    if provider_name == "fastapi_mail":
        logger.info("Using FastAPIMailProvider")
        return FastAPIMailProvider()
    elif provider_name == "mock":
        logger.info("Using MockEmailProvider")
        return MockEmailProvider()
    else:
        # Pour smtp, sendgrid, mailgun, on utilise l'ancien EmailSender
        logger.info(f"Using EmailSender for provider: {provider_name}")
        from app.infrastructure.email_sender import EmailSender
        return EmailSender()

