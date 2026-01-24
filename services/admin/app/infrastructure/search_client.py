"""
Client pour appeler le Service Recherche de manière asynchrone
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
        
        # Construire les éducations au format attendu (nested)
        educations = []
        educations_list = profile_data.get("educations", [])
        for education in educations_list:
            if isinstance(education, dict):
                educations.append({
                    "diploma": education.get("diploma", ""),
                    "institution": education.get("institution", ""),
                    "level": education.get("level", ""),  # Niveau d'étude (Bac, Bac+2, Bac+5, etc.)
                    "graduation_year": education.get("graduation_year")
                })
        
        # Extraire les langues depuis les compétences (type SOFT ou langues nommées)
        # Les langues sont stockées comme compétences, on les extrait ici
        languages = []
        for skill in skills_list:
            if isinstance(skill, dict):
                skill_name = skill.get("name", "").lower()
                # Liste des langues communes
                known_languages = ["français", "anglais", "espagnol", "allemand", "italien", 
                                 "portugais", "chinois", "arabe", "russe", "mandarin", "japonais"]
                if any(lang in skill_name for lang in known_languages):
                    # Essayer d'extraire le niveau de la compétence ou utiliser un niveau par défaut
                    level = skill.get("level", "").upper()
                    if not level:
                        # Si pas de niveau explicite, considérer comme "courant"
                        level = "INTERMEDIATE"
                    languages.append({
                        "name": skill.get("name", ""),
                        "level": level
                    })
        
        # Années d'expérience
        years_of_experience = profile_data.get("total_experience", 0) or 0
        
        # Localisation
        city = profile_data.get("city", "")
        country = profile_data.get("country", "")
        location = f"{city}, {country}".strip(", ")
        
        # Préparer le document pour l'indexation
        # Le statut doit être VALIDATED car seuls les candidats validés sont indexés
        # Récupérer la disponibilité depuis job_preferences si disponible
        job_preferences = profile_data.get("job_preferences", {})
        if isinstance(job_preferences, dict):
            availability = job_preferences.get("availability")
        else:
            availability = None
        
        # Extraire le score admin - priorité à admin_score direct, puis admin_report.overall_score
        admin_score = profile_data.get("admin_score")
        if admin_score is None and profile_data.get("admin_report"):
            admin_report = profile_data.get("admin_report")
            if isinstance(admin_report, dict):
                admin_score = admin_report.get("overall_score")
        
        candidate_document = {
            "candidate_id": candidate_id,
            "full_name": full_name,
            "title": profile_data.get("profile_title", ""),
            "skills": skills,
            "educations": educations,  # Éducations indexées en nested
            "languages": languages,  # Langues extraites des compétences
            "years_of_experience": years_of_experience,
            "location": location,
            "is_verified": True,
            "summary": profile_data.get("professional_summary", ""),
            "status": "VALIDATED",  # Seuls les candidats validés sont indexés
            "main_job": profile_data.get("main_job", ""),
            "sector": profile_data.get("sector", ""),
            "admin_score": admin_score,  # Score admin d'évaluation
            "admin_report": profile_data.get("admin_report"),  # Rapport admin complet si disponible
            "photo_url": profile_data.get("photo_url"),  # Photo de profil du candidat
            "availability": availability,  # Disponibilité du candidat
        }
        
        print(f"📝 Indexation candidat {candidate_id}: status=VALIDATED, admin_score={admin_score}, is_verified=True")
        
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

