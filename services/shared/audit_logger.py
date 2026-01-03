"""
Fonction utilitaire partagée pour enregistrer les accès dans le service Audit

Cette fonction peut être appelée par n'importe quel service pour enregistrer
un accès à un profil candidat.
"""
import httpx
from typing import Optional
import sys
import os

# Ajouter le chemin du module shared au PYTHONPATH
shared_path = os.path.join(os.path.dirname(os.path.dirname(__file__)))
if shared_path not in sys.path:
    sys.path.insert(0, shared_path)

from services.shared.internal_auth import get_service_token_header


async def log_access(
    service_name: str,
    audit_service_url: str,
    recruiter_id: int,
    recruiter_email: str,
    recruiter_name: Optional[str],
    company_id: int,
    company_name: Optional[str],
    candidate_id: int,
    candidate_email: Optional[str] = None,
    candidate_name: Optional[str] = None,
    action_type: str = "VIEW_PROFILE",
    access_type: str = "profile_view",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    metadata: Optional[dict] = None
) -> dict:
    """
    Enregistre un accès dans le service Audit
    
    Cette fonction utilitaire peut être appelée par n'importe quel service
    pour enregistrer un accès à un profil candidat.
    
    Args:
        service_name: Nom du service appelant (ex: "search-service", "document-service")
        audit_service_url: URL du service Audit
        recruiter_id: ID du recruteur
        recruiter_email: Email du recruteur
        recruiter_name: Nom du recruteur (optionnel)
        company_id: ID de l'entreprise
        company_name: Nom de l'entreprise (optionnel)
        candidate_id: ID du candidat
        candidate_email: Email du candidat (optionnel)
        candidate_name: Nom du candidat (optionnel)
        action_type: Type d'action (VIEW_PROFILE, DOWNLOAD_CV)
        access_type: Type d'accès (profile_view, document_view, etc.)
        ip_address: Adresse IP (optionnel)
        user_agent: User Agent (optionnel)
        metadata: Métadonnées supplémentaires (optionnel)
    
    Returns:
        Dict avec les données du log créé, ou {} en cas d'erreur
    
    Example:
        ```python
        await log_access(
            service_name="search-service",
            audit_service_url="http://audit:8000",
            recruiter_id=123,
            recruiter_email="recruiter@example.com",
            recruiter_name="Jane Recruiter",
            company_id=1,
            company_name="Acme Corp",
            candidate_id=456,
            candidate_email="candidate@example.com",
            candidate_name="John Doe",
            action_type="VIEW_PROFILE"
        )
        ```
    """
    try:
        # Générer les headers avec le token de service
        headers = get_service_token_header(service_name)
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{audit_service_url}/api/v1/audit",
                json={
                    "recruiter_id": recruiter_id,
                    "recruiter_email": recruiter_email,
                    "recruiter_name": recruiter_name,
                    "company_id": company_id,
                    "company_name": company_name,
                    "candidate_id": candidate_id,
                    "candidate_email": candidate_email,
                    "candidate_name": candidate_name,
                    "action_type": action_type,
                    "access_type": access_type,
                    "ip_address": ip_address,
                    "user_agent": user_agent,
                    "metadata": metadata
                },
                headers=headers
            )
            
            if response.status_code == 201:
                return response.json()
            else:
                # Ne pas bloquer si l'audit échoue, juste logger
                print(f"⚠️ Warning: Failed to log access: {response.status_code} - {response.text}")
                return {}
    except Exception as e:
        # Ne pas bloquer si l'audit échoue, juste logger
        print(f"⚠️ Warning: Failed to log access: {str(e)}")
        return {}

