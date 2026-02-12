"""
Client pour appeler le Service Notification
"""
import httpx
from typing import Optional
import sys
import os
import importlib.util

# Ajouter le chemin du module shared au PYTHONPATH
shared_path = "/shared"
if os.path.exists(shared_path) and shared_path not in sys.path:
    sys.path.insert(0, shared_path)

# Importer depuis shared
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
        print(f"Warning: Failed to load internal_auth from {internal_auth_path}: {e}")
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
import logging

logger = logging.getLogger(__name__)


async def send_candidate_profile_created_notification(
    candidate_email: str,
    candidate_name: str,
    dashboard_url: Optional[str] = None
) -> None:
    """
    Envoie un email au candidat après création de son profil (onboarding complété avec parsing CV).
    Appelé par le Candidate Service après complétion de l'onboarding.
    """
    try:
        headers = get_service_token_header("candidate-service")
        if not dashboard_url:
            dashboard_url = f"{settings.FRONTEND_URL}/candidate/dashboard"
        payload = {
            "candidate_email": candidate_email,
            "candidate_name": candidate_name,
            "dashboard_url": dashboard_url
        }
        logger.info(f"Sending profile created notification to candidate {candidate_email}")
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/triggers/notify_candidate_profile_created",
                json=payload,
                headers=headers
            )
            if response.status_code != 202:
                logger.error(f"Notification service returned {response.status_code}: {response.text}")
            response.raise_for_status()
            logger.info(f"Profile created notification sent successfully to {candidate_email}")
    except Exception as e:
        logger.error(f"⚠️ Erreur lors de l'envoi de l'email profil créé: {str(e)}", exc_info=True)


async def send_candidate_welcome_notification(
    candidate_email: str,
    candidate_name: str,
    dashboard_url: Optional[str] = None
) -> None:
    """
    Envoie un email de bienvenue au candidat après complétion de l'onboarding
    
    Args:
        candidate_email: Email du candidat
        candidate_name: Nom du candidat
        dashboard_url: URL du tableau de bord (optionnel)
    
    Raises:
        Exception: Si l'envoi de la notification échoue (mais ne bloque pas le processus)
    """
    try:
        headers = get_service_token_header("candidate-service")
        
        if not dashboard_url:
            dashboard_url = f"{settings.FRONTEND_URL}/candidate/dashboard"
        
        payload = {
            "candidate_email": candidate_email,
            "candidate_name": candidate_name,
            "dashboard_url": dashboard_url
        }
        
        logger.info(f"Sending welcome notification to candidate {candidate_email}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/triggers/notify_candidate_welcome",
                json=payload,
                headers=headers
            )
            
            if response.status_code != 202:
                logger.error(f"Notification service returned {response.status_code}: {response.text}")
            
            response.raise_for_status()
            logger.info(f"Welcome notification sent successfully to {candidate_email}")
    except Exception as e:
        # Ne pas bloquer le processus si l'envoi d'email échoue
        logger.error(f"⚠️ Erreur lors de l'envoi de l'email de bienvenue: {str(e)}", exc_info=True)
        # Ne pas lever l'exception pour ne pas bloquer la soumission du profil
