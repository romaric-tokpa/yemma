"""
Client pour appeler le Service Notification
"""
import httpx
from typing import Dict, Any, Optional
import sys
import os
import importlib.util

# Ajouter le chemin du module shared au PYTHONPATH
# Le module shared est monté dans /shared via docker-compose
# Utiliser la même approche que candidate/app/infrastructure/internal_auth.py
shared_path = "/shared"
if os.path.exists(shared_path) and shared_path not in sys.path:
    sys.path.insert(0, shared_path)

# Importer depuis shared en utilisant importlib pour éviter les problèmes de module
get_service_token_header = None
internal_auth_path = os.path.join(shared_path, "internal_auth.py")
if os.path.exists(internal_auth_path):
    try:
        spec = importlib.util.spec_from_file_location("shared.internal_auth", internal_auth_path)
        if spec and spec.loader:
            internal_auth_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(internal_auth_module)
            get_service_token_header = internal_auth_module.get_service_token_header
        else:
            from shared.internal_auth import get_service_token_header
    except Exception as e:
        print(f"Warning: Failed to load internal_auth from {internal_auth_path} using importlib: {e}")
        try:
            from shared.internal_auth import get_service_token_header
        except ImportError:
            pass
else:
    try:
        from shared.internal_auth import get_service_token_header
    except ImportError:
        pass

if get_service_token_header is None:
    raise ImportError(
        f"Could not import get_service_token_header from shared module. "
        f"Tried paths: ['{shared_path}']. "
        f"Make sure ./services/shared:/shared is mounted in docker-compose.yml and restart the container."
    )

from app.core.config import settings
from app.core.exceptions import InvitationError


async def send_invitation_notification(
    recipient_email: str,
    recipient_name: str,
    company_name: str,
    invitation_token: str,
    invitation_url: Optional[str] = None,
    temporary_password: Optional[str] = None
) -> None:
    """
    Envoie une notification d'invitation via le Service Notification
    
    Args:
        recipient_email: Email du recruteur invité
        recipient_name: Nom du recruteur
        company_name: Nom de l'entreprise
        invitation_token: Token d'invitation
        invitation_url: URL d'acceptation (optionnel)
    
    Raises:
        InvitationError: Si l'envoi de la notification échoue
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        headers = get_service_token_header("company-service")
        
        if not invitation_url:
            invitation_url = f"{settings.FRONTEND_URL}/login"
        
        # Construire le payload JSON, en excluant temporary_password si None
        payload = {
            "recipient_email": recipient_email,
            "recipient_name": recipient_name,
            "company_name": company_name,
            "invitation_token": invitation_token or "",  # Peut être None, donc utiliser "" par défaut
            "invitation_url": invitation_url or f"{settings.FRONTEND_URL}/login",
        }
        # Ajouter temporary_password seulement s'il n'est pas None et non vide
        if temporary_password is not None and temporary_password.strip():
            payload["temporary_password"] = temporary_password
        
        logger.info(f"Sending invitation notification to {recipient_email} with temporary_password={'present' if temporary_password else 'none'}")
        logger.debug(f"Payload keys: {list(payload.keys())}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/triggers/notify_invitation",
                json=payload,
                headers=headers
            )
            
            # Log la réponse en cas d'erreur
            if response.status_code != 202:
                logger.error(f"Notification service returned {response.status_code}: {response.text}")
            
            response.raise_for_status()
            logger.info(f"Invitation notification sent successfully to {recipient_email}")
    except httpx.HTTPStatusError as e:
        error_msg = f"HTTP error {e.response.status_code}: {e.response.text}"
        logger.error(f"⚠️ Erreur HTTP lors de l'envoi de la notification d'invitation: {error_msg}")
        raise InvitationError(f"Erreur lors de l'envoi de l'invitation: {error_msg}")
    except httpx.RequestError as e:
        error_msg = f"Request error: {str(e)}"
        logger.error(f"⚠️ Erreur de requête lors de l'envoi de la notification d'invitation: {error_msg}")
        raise InvitationError(f"Erreur lors de l'envoi de l'invitation: Impossible de contacter le service de notification")
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(f"⚠️ Erreur inattendue lors de l'envoi de la notification: {error_msg}")
        raise InvitationError(f"Erreur lors de l'envoi de l'invitation: {str(e)}")


async def send_company_welcome_notification(
    recipient_email: str,
    recipient_name: str,
    company_name: str,
    dashboard_url: Optional[str] = None
) -> None:
    """
    Envoie un email de bienvenue à une entreprise après création du compte
    
    Args:
        recipient_email: Email du recruteur/admin
        recipient_name: Nom du recruteur/admin
        company_name: Nom de l'entreprise
        dashboard_url: URL du tableau de bord (optionnel)
    
    Raises:
        Exception: Si l'envoi de la notification échoue (mais ne bloque pas le processus)
    """
    try:
        headers = get_service_token_header("company-service")
        
        if not dashboard_url:
            dashboard_url = f"{settings.FRONTEND_URL}/company/dashboard"
        
        payload = {
            "recipient_email": recipient_email,
            "recipient_name": recipient_name,
            "company_name": company_name,
            "dashboard_url": dashboard_url
        }
        
        logger.info(f"Sending welcome notification to company {company_name} ({recipient_email})")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/triggers/notify_company_welcome",
                json=payload,
                headers=headers
            )
            
            if response.status_code != 202:
                logger.error(f"Notification service returned {response.status_code}: {response.text}")
            
            response.raise_for_status()
            logger.info(f"Welcome notification sent successfully to {recipient_email}")
    except Exception as e:
        # Ne pas bloquer le processus si l'envoi d'email échoue
        logger.error(f"⚠️ Erreur lors de l'envoi de l'email de bienvenue: {str(e)}", exc_info=True)
        # Ne pas lever l'exception pour ne pas bloquer la création de l'entreprise

