"""
Service d'indexation des candidats dans ElasticSearch

Convertit les données candidat au format ElasticSearch selon le mapping défini.
"""
from typing import Dict, Any, List, Optional
from app.infrastructure.elasticsearch import es_client


def index_candidate(candidate_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convertit un objet candidat en document ElasticSearch
    
    Args:
        candidate_data: Dictionnaire contenant les données du candidat avec les clés :
            - full_name (str): Nom complet du candidat
            - title (str): Titre du profil
            - skills (List[Dict]): Liste de compétences avec 'name' et 'level'
            - years_of_experience (int): Années d'expérience
            - location (str): Localisation
            - is_verified (bool): Statut de vérification
            - summary (str): Résumé professionnel
            - candidate_id (Optional[int]): ID du candidat (optionnel, utilisé comme ID du document)
    
    Returns:
        Dict contenant le document formaté pour ElasticSearch
    
    Example:
        candidate_data = {
            "candidate_id": 123,
            "full_name": "John Doe",
            "title": "Développeur Full Stack",
            "skills": [
                {"name": "Python", "level": "Expert"},
                {"name": "React", "level": "Avancé"}
            ],
            "years_of_experience": 5,
            "location": "Paris, France",
            "is_verified": True,
            "summary": "Développeur expérimenté en Python et React..."
        }
        
        document = index_candidate(candidate_data)
    """
    # Extraire les données
    full_name = candidate_data.get("full_name", "")
    title = candidate_data.get("title", "")
    skills = candidate_data.get("skills", [])
    years_of_experience = candidate_data.get("years_of_experience", 0)
    location = candidate_data.get("location", "")
    is_verified = candidate_data.get("is_verified", False)
    summary = candidate_data.get("summary", "")
    candidate_id = candidate_data.get("candidate_id")
    
    # Formater les compétences selon le mapping nested
    formatted_skills = []
    for skill in skills:
        if isinstance(skill, dict):
            formatted_skill = {
                "name": skill.get("name", ""),
                "level": skill.get("level", "")
            }
            # Ne garder que les compétences avec un nom
            if formatted_skill["name"]:
                formatted_skills.append(formatted_skill)
        elif isinstance(skill, str):
            # Si c'est juste une string, la convertir en dict
            formatted_skills.append({
                "name": skill,
                "level": ""
            })
    
    # Construire le document ElasticSearch
    # Le statut doit être VALIDATED car seuls les candidats validés sont indexés
    document = {
        "full_name": full_name,
        "title": title,
        "skills": formatted_skills,
        "years_of_experience": int(years_of_experience) if years_of_experience else 0,
        "location": location,
        "is_verified": bool(is_verified),
        "summary": summary,
        "status": candidate_data.get("status", "VALIDATED"),  # Par défaut VALIDATED
    }
    
    # Ajouter candidate_id - toujours présent car c'est l'ID du profil dans la base de données
    # Si candidate_id n'est pas fourni, cela indique un problème dans l'indexation
    if candidate_id is not None:
        document["candidate_id"] = candidate_id
    else:
        # Logger un avertissement si candidate_id n'est pas fourni
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"candidate_id is None in candidate_data: {candidate_data.keys()}")
    
    # Ajouter les éducations si présentes (nested)
    educations = candidate_data.get("educations", [])
    if educations:
        document["educations"] = educations
    
    # Ajouter les langues si présentes (nested)
    languages = candidate_data.get("languages", [])
    if languages:
        document["languages"] = languages
    
    # Ajouter d'autres champs optionnels si présents
    optional_fields = [
        "email", "phone", "sector", "contract_type", "main_job",
        "salary_expectations", "availability", "created_at", "updated_at", "admin_score", "admin_report",
        "photo_url"
    ]
    for field in optional_fields:
        if field in candidate_data:
            document[field] = candidate_data[field]
    
    return document


async def index_candidate_async(candidate_data: Dict[str, Any]) -> bool:
    """
    Indexe un candidat dans ElasticSearch de manière asynchrone
    
    Args:
        candidate_data: Dictionnaire contenant les données du candidat
    
    Returns:
        bool: True si l'indexation a réussi, False sinon
    
    Raises:
        ElasticsearchError: En cas d'erreur lors de l'indexation
    """
    # Convertir les données candidat en document ElasticSearch
    document = index_candidate(candidate_data)
    
    # Déterminer l'ID du document
    document_id = str(candidate_data.get("candidate_id", ""))
    if not document_id:
        # Générer un ID basé sur le nom si pas d'ID
        document_id = candidate_data.get("full_name", "").lower().replace(" ", "_")
    
    # Indexer le document dans l'index configuré (certified_candidates par défaut)
    await es_client.connect()
    
    try:
        await es_client.client.index(
            index=es_client.index_name,  # Utiliser le nom d'index configuré au lieu de "candidates" en dur
            id=document_id,
            document=document
        )
    except Exception as e:
        from app.core.exceptions import ElasticsearchError
        raise ElasticsearchError(f"Failed to index document: {str(e)}")
    
    return True


async def bulk_index_candidates(candidates_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Indexe plusieurs candidats en une seule opération (bulk)
    
    Args:
        candidates_data: Liste de dictionnaires contenant les données des candidats
    
    Returns:
        Dict avec le nombre de documents indexés et les erreurs éventuelles
    """
    await es_client.connect()
    
    actions = []
    for candidate_data in candidates_data:
        document = index_candidate(candidate_data)
        document_id = str(candidate_data.get("candidate_id", ""))
        if not document_id:
            document_id = candidate_data.get("full_name", "").lower().replace(" ", "_")
        
        action = {
            "_index": es_client.index_name,  # Utiliser le nom d'index configuré au lieu de "candidates" en dur
            "_id": document_id,
            "_source": document
        }
        actions.append(action)
    
    # Exécuter le bulk index
    from elasticsearch.helpers import async_bulk
    
    try:
        success_count = 0
        errors = []
        
        async for ok, result in async_bulk(
            es_client.client,
            actions,
            raise_on_error=False
        ):
            if ok:
                success_count += 1
            else:
                errors.append(result)
        
        return {
            "indexed": success_count,
            "errors": errors if errors else [],
            "total": len(candidates_data)
        }
    except Exception as e:
        raise Exception(f"Bulk index failed: {str(e)}")

