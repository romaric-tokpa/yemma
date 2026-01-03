"""
Client pour appeler le Service Candidat
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
from app.core.exceptions import CandidateNotFoundError


async def get_candidate_profile(candidate_id: int) -> Dict[str, Any]:
    """
    Récupère le profil complet d'un candidat depuis le service candidat
    
    Args:
        candidate_id: ID du candidat
    
    Returns:
        Dict contenant les données du profil
    
    Raises:
        CandidateNotFoundError: Si le candidat n'existe pas
    """
    try:
        # Générer les headers avec le token de service
        headers = get_service_token_header("admin-service")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{settings.CANDIDATE_SERVICE_URL}/api/v1/profiles/{candidate_id}",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise CandidateNotFoundError(str(candidate_id))
        raise
    except httpx.HTTPError as e:
        raise Exception(f"Failed to fetch candidate profile: {str(e)}")


async def update_candidate_status(candidate_id: int, status: str, report_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Met à jour le statut d'un candidat dans le service candidat
    
    Args:
        candidate_id: ID du candidat
        status: Nouveau statut (VALIDATED, REJECTED, ARCHIVED)
        report_data: Données du rapport d'évaluation (optionnel)
    
    Returns:
        Dict avec les données mises à jour
    """
    update_data = {
        "status": status,
    }
    
    if report_data:
        update_data["admin_report"] = report_data
    
    try:
        # Générer les headers avec le token de service
        headers = get_service_token_header("admin-service")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.put(
                f"{settings.CANDIDATE_SERVICE_URL}/api/v1/profiles/{candidate_id}",
                json=update_data,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise Exception(f"Failed to update candidate status: {str(e)}")

