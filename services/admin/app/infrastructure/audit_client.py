"""
Client pour appeler le Service Audit pour logger les incidents
"""
import httpx
from typing import Dict, Any, Optional
import sys
import os
from datetime import datetime

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


async def log_incident(
    incident_type: str,
    description: str,
    candidate_id: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Enregistre un incident dans le Service Audit
    
    Args:
        incident_type: Type d'incident (ex: "indexation_failed", "validation_error")
        description: Description de l'incident
        candidate_id: ID du candidat concerné (optionnel)
        metadata: Métadonnées supplémentaires (optionnel)
    
    Returns:
        bool: True si l'incident a été enregistré avec succès
    """
    try:
        # Générer les headers avec le token de service
        headers = get_service_token_header("admin-service")
        
        # Préparer les données de l'incident
        import json
        incident_metadata = {
            "incident_type": incident_type,
            "description": description,
            "timestamp": datetime.utcnow().isoformat(),
            **(metadata or {})
        }
        
        incident_data = {
            "recruiter_id": 0,  # Système
            "recruiter_email": "system@yemma.com",
            "recruiter_name": "Système Yemma",
            "company_id": 0,  # Système
            "company_name": "Yemma Platform",
            "candidate_id": candidate_id or 0,
            "candidate_email": None,
            "candidate_name": None,
            "access_type": "system_incident",
            "action_type": "SYSTEM_ERROR",
            "metadata": incident_metadata  # Le service Audit convertira en JSON string
        }
        
        # Appeler le service Audit
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.AUDIT_SERVICE_URL}/api/v1/audit",
                json=incident_data,
                headers=headers
            )
            response.raise_for_status()
        
        return True
    except httpx.HTTPError as e:
        # Si l'audit échoue, on log dans les logs système
        print(f"⚠️ Erreur lors de l'enregistrement de l'incident dans Audit Service: {str(e)}")
        print(f"   Incident: {incident_type} - {description}")
        return False
    except Exception as e:
        print(f"⚠️ Erreur inattendue lors de l'enregistrement de l'incident: {str(e)}")
        return False

