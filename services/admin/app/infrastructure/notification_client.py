"""
Client pour appeler le Service Notification
"""
import httpx
from typing import Dict, Any, Optional
import sys
import os

# Ajouter le chemin du module shared au PYTHONPATH
# Le module shared est monté dans /shared via docker-compose
# Utiliser la même approche que candidate/app/infrastructure/internal_auth.py
import importlib.util
shared_path = "/shared"
if os.path.exists(shared_path) and shared_path not in sys.path:
    sys.path.insert(0, shared_path)

# Importer depuis shared en utilisant importlib pour éviter les problèmes de module
internal_auth_path = os.path.join(shared_path, "internal_auth.py")
if os.path.exists(internal_auth_path):
    spec = importlib.util.spec_from_file_location("shared.internal_auth", internal_auth_path)
    if spec and spec.loader:
        internal_auth_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(internal_auth_module)
        get_service_token_header = internal_auth_module.get_service_token_header
    else:
        from shared.internal_auth import get_service_token_header
else:
    from shared.internal_auth import get_service_token_header

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

