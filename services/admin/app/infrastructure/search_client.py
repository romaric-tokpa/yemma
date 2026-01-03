"""
Client pour appeler le Service Recherche de manière asynchrone
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


async def index_candidate_in_search(candidate_id: int, profile_data: Dict[str, Any]) -> bool:
    """
    Indexe un candidat dans le Service Recherche (synchrone)
    
    Args:
        candidate_id: ID du candidat
        profile_data: Données du profil récupérées du Candidate Service
    
    Returns:
        bool: True si l'indexation a réussi
    
    Raises:
        Exception: Si l'indexation échoue (pour transaction distribuée)
    """
    try:
        # Le profil récupéré du Candidate Service est au format ProfileDetailResponse
        # Extraire les données nécessaires
        first_name = profile_data.get("first_name", "")
        last_name = profile_data.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()
        
        # Construire les compétences au format attendu
        skills = []
        skills_list = profile_data.get("skills", [])
        for skill in skills_list:
            if isinstance(skill, dict):
                skills.append({
                    "name": skill.get("name", ""),
                    "level": skill.get("level", "").upper() if skill.get("level") else ""
                })
        
        # Années d'expérience
        years_of_experience = profile_data.get("total_experience", 0) or 0
        
        # Localisation
        city = profile_data.get("city", "")
        country = profile_data.get("country", "")
        location = f"{city}, {country}".strip(", ")
        
        # Préparer le document pour l'indexation
        candidate_document = {
            "candidate_id": candidate_id,
            "full_name": full_name,
            "title": profile_data.get("profile_title", ""),
            "skills": skills,
            "years_of_experience": years_of_experience,
            "location": location,
            "is_verified": True,
            "summary": profile_data.get("professional_summary", ""),
        }
        
        # Générer les headers avec le token de service
        headers = get_service_token_header("admin-service")
        
        # Appel synchrone au service de recherche (bloquant pour la transaction)
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.SEARCH_SERVICE_URL}/api/v1/candidates/index",
                json=candidate_document,
                headers=headers
            )
            response.raise_for_status()
        
        return True
    except httpx.HTTPStatusError as e:
        error_msg = f"Erreur HTTP lors de l'indexation: {e.response.status_code} - {e.response.text}"
        print(f"❌ {error_msg}")
        raise Exception(error_msg) from e
    except httpx.HTTPError as e:
        error_msg = f"Erreur réseau lors de l'indexation: {str(e)}"
        print(f"❌ {error_msg}")
        raise Exception(error_msg) from e
    except Exception as e:
        error_msg = f"Erreur inattendue lors de l'indexation: {str(e)}"
        print(f"❌ {error_msg}")
        raise Exception(error_msg) from e


async def remove_candidate_from_search(candidate_id: int) -> bool:
    """
    Supprime un candidat de l'index de recherche de manière asynchrone
    
    Args:
        candidate_id: ID du candidat à supprimer
    
    Returns:
        bool: True si la suppression a réussi
    """
    try:
        # Générer les headers avec le token de service
        headers = get_service_token_header("admin-service")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.delete(
                f"{settings.SEARCH_SERVICE_URL}/api/v1/candidates/index/{candidate_id}",
                headers=headers
            )
            response.raise_for_status()
        
        return True
    except httpx.HTTPError as e:
        # Log l'erreur mais ne bloque pas le processus
        print(f"⚠️ Erreur lors de la suppression de l'index: {str(e)}")
        return False
    except Exception as e:
        print(f"⚠️ Erreur inattendue lors de la suppression: {str(e)}")
        return False

