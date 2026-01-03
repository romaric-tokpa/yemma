"""
Client pour appeler le Service Notification
"""
import httpx
from typing import Dict, Any, Optional
import sys
import os

# Ajouter le chemin du module shared au PYTHONPATH
shared_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "shared")
if shared_path not in sys.path:
    sys.path.insert(0, shared_path)

from services.shared.internal_auth import get_service_token_header
from app.core.config import settings


async def send_invitation_notification(
    recipient_email: str,
    recipient_name: str,
    company_name: str,
    invitation_token: str,
    invitation_url: Optional[str] = None
) -> bool:
    """
    Envoie une notification d'invitation via le Service Notification
    
    Args:
        recipient_email: Email du recruteur invité
        recipient_name: Nom du recruteur
        company_name: Nom de l'entreprise
        invitation_token: Token d'invitation
        invitation_url: URL d'acceptation (optionnel)
    
    Returns:
        bool: True si la notification a été envoyée avec succès
    """
    try:
        headers = get_service_token_header("company-service")
        
        if not invitation_url:
            invitation_url = f"{settings.FRONTEND_URL}/invitation/accept?token={invitation_token}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/triggers/notify_invitation",
                json={
                    "recipient_email": recipient_email,
                    "recipient_name": recipient_name,
                    "company_name": company_name,
                    "invitation_token": invitation_token,
                    "invitation_url": invitation_url
                },
                headers=headers
            )
            response.raise_for_status()
            return True
    except httpx.HTTPError as e:
        print(f"⚠️ Erreur lors de l'envoi de la notification d'invitation: {str(e)}")
        return False
    except Exception as e:
        print(f"⚠️ Erreur inattendue lors de l'envoi de la notification: {str(e)}")
        return False

