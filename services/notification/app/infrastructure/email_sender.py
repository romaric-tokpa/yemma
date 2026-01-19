"""
Service d'envoi d'emails (SMTP, SendGrid, Mailgun)
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import httpx

from app.core.config import settings
from app.core.exceptions import EmailError
from app.infrastructure.email_providers import get_email_provider


class EmailSender:
    """Service d'envoi d'emails"""
    
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None
    ) -> bool:
        """
        Envoie un email
        
        Args:
            to_email: Email du destinataire
            subject: Sujet
            html_body: Corps HTML
            text_body: Corps texte (optionnel)
            to_name: Nom du destinataire (optionnel)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        provider_name = settings.EMAIL_PROVIDER.lower()
        logger.info(f"EmailSender.send_email called with provider: {provider_name} (EMAIL_PROVIDER={settings.EMAIL_PROVIDER})")
        
        # Utiliser les nouveaux providers (FastAPI-Mail, Mock)
        if provider_name in ["fastapi_mail", "mock"]:
            logger.info(f"Using new provider system for: {provider_name}")
            provider = get_email_provider()
            return await provider.send_email(to_email, subject, html_body, text_body, to_name)
        
        # Utiliser les anciens providers (SMTP, SendGrid, Mailgun)
        if provider_name == "smtp":
            return await EmailSender._send_via_smtp(to_email, subject, html_body, text_body, to_name)
        elif provider_name == "sendgrid":
            return await EmailSender._send_via_sendgrid(to_email, subject, html_body, text_body, to_name)
        elif provider_name == "mailgun":
            return await EmailSender._send_via_mailgun(to_email, subject, html_body, text_body, to_name)
        else:
            raise EmailError(f"Unsupported email provider: {settings.EMAIL_PROVIDER}")
    
    @staticmethod
    async def _send_via_smtp(
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None
    ) -> bool:
        """Envoie un email via SMTP"""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email
            
            # Ajouter le corps texte et HTML
            if text_body:
                part1 = MIMEText(text_body, "plain")
                msg.attach(part1)
            
            part2 = MIMEText(html_body, "html")
            msg.attach(part2)
            
            # Envoyer l'email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            return True
        except Exception as e:
            raise EmailError(f"Failed to send email via SMTP: {str(e)}")
    
    @staticmethod
    async def _send_via_sendgrid(
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None
    ) -> bool:
        """Envoie un email via SendGrid (utilise le SDK officiel si disponible, sinon API REST)"""
        if not settings.SENDGRID_API_KEY:
            raise EmailError("SendGrid API key not configured")
        
        try:
            # Essayer d'utiliser le SDK SendGrid
            try:
                from sendgrid import SendGridAPIClient
                from sendgrid.helpers.mail import Mail, Email, To, Content
                
                message = Mail(
                    from_email=Email(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME),
                    to_emails=To(to_email, to_name or to_email),
                    subject=subject,
                    html_content=Content("text/html", html_body)
                )
                
                if text_body:
                    message.add_content(Content("text/plain", text_body))
                
                sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
                response = sg.send(message)
                
                if response.status_code >= 200 and response.status_code < 300:
                    return True
                else:
                    raise EmailError(f"SendGrid API returned status {response.status_code}")
                    
            except ImportError:
                # Fallback vers API REST si SDK non disponible
                url = "https://api.sendgrid.com/v3/mail/send"
                headers = {
                    "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
                    "Content-Type": "application/json",
                }
                
                payload = {
                    "personalizations": [{
                        "to": [{
                            "email": to_email,
                            "name": to_name or to_email
                        }]
                    }],
                    "from": {
                        "email": settings.SENDGRID_FROM_EMAIL,
                        "name": settings.SENDGRID_FROM_NAME
                    },
                    "subject": subject,
                    "content": [
                        {
                            "type": "text/html",
                            "value": html_body
                        }
                    ]
                }
                
                if text_body:
                    payload["content"].append({
                        "type": "text/plain",
                        "value": text_body
                    })
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, headers=headers)
                    response.raise_for_status()
                
                return True
                
        except Exception as e:
            raise EmailError(f"Failed to send email via SendGrid: {str(e)}")
    
    @staticmethod
    async def _send_via_mailgun(
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None
    ) -> bool:
        """Envoie un email via Mailgun"""
        if not settings.MAILGUN_API_KEY or not settings.MAILGUN_DOMAIN:
            raise EmailError("Mailgun API key or domain not configured")
        
        try:
            url = f"https://api.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages"
            auth = ("api", settings.MAILGUN_API_KEY)
            
            data = {
                "from": f"{settings.MAILGUN_FROM_NAME} <{settings.MAILGUN_FROM_EMAIL}>",
                "to": to_email,
                "subject": subject,
                "html": html_body,
            }
            
            if text_body:
                data["text"] = text_body
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, auth=auth, data=data)
                response.raise_for_status()
            
            return True
        except Exception as e:
            raise EmailError(f"Failed to send email via Mailgun: {str(e)}")


