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


async def send_profile_validated_notification(
    recipient_email: str,
    recipient_name: str,
    candidate_name: Optional[str] = None,
    profile_url: Optional[str] = None
) -> bool:
    """
    Envoie une notification de profil validé à un candidat
    
    Args:
        recipient_email: Email du candidat
        recipient_name: Nom du candidat
        candidate_name: Nom du candidat (pour le template)
        profile_url: URL du profil (optionnel)
    
    Returns:
        bool: True si la notification a été envoyée avec succès
    """
    try:
        # Générer les headers avec le token de service
        headers = get_service_token_header("admin-service")
        
        # Préparer les données du template
        template_data = {
            "recipient_name": recipient_name,
            "candidate_name": candidate_name or recipient_name,
        }
        if profile_url:
            template_data["profile_url"] = profile_url
        
        # Appeler le service de notification
        async with httpx.AsyncClient(timeout=30.0) as client:
            # L'endpoint attend les paramètres dans le body directement
            response = await client.post(
                f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/notifications/send/profile-validated",
                json={
                    "recipient_email": recipient_email,
                    "recipient_name": recipient_name,
                    "template_data": template_data
                },
                headers=headers
            )
            response.raise_for_status()
        
        return True
    except httpx.HTTPError as e:
        # Log l'erreur mais ne bloque pas le processus de validation
        print(f"⚠️ Erreur lors de l'envoi de la notification: {str(e)}")
        return False
    except Exception as e:
        print(f"⚠️ Erreur inattendue lors de l'envoi de la notification: {str(e)}")
        return False

