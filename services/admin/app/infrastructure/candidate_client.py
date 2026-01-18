"""
Client pour appeler le Service Candidat
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
    from datetime import datetime
    
    update_data = {
        "status": status,
    }
    
    if report_data:
        update_data["admin_report"] = report_data
        # Ajouter le score admin si disponible
        if "overall_score" in report_data:
            update_data["admin_score"] = report_data["overall_score"]
        # Ajouter la date de validation/rejet
        if status == "VALIDATED":
            update_data["validated_at"] = datetime.utcnow().isoformat()
        elif status == "REJECTED":
            update_data["rejected_at"] = datetime.utcnow().isoformat()
            # Ajouter le motif de rejet si disponible dans report_data
            if "rejection_reason" in report_data:
                update_data["rejection_reason"] = report_data["rejection_reason"]
    
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

