"""
Endpoints de statistiques pour le service Search
"""
from typing import List, Dict
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.infrastructure.elasticsearch import es_client
from app.infrastructure.internal_auth import verify_internal_token

router = APIRouter()


class TopSkill(BaseModel):
    """Compétence la plus recherchée"""
    name: str
    count: int
    percentage: float


@router.get("/skills/top", response_model=List[TopSkill])
async def get_top_skills(
    limit: int = 10,
    service_info: dict = Depends(verify_internal_token)
):
    """
    Récupère le top N des compétences les plus fréquentes dans les profils indexés
    
    Nécessite un token de service interne
    
    Note: Cette statistique est basée sur les compétences présentes dans les profils indexés,
    pas sur les recherches effectuées. Pour un vrai tracking des recherches, il faudrait
    implémenter un système de logging des requêtes.
    """
    await es_client.connect()
    
    try:
        # Requête d'agrégation pour compter les compétences
        query = {
            "size": 0,  # Pas de résultats, seulement les agrégations
            "aggs": {
                "skills": {
                    "nested": {
                        "path": "skills"
                    },
                    "aggs": {
                        "skill_names": {
                            "terms": {
                                "field": "skills.name.keyword",
                                "size": limit,
                                "order": {"_count": "desc"}
                            }
                        }
                    }
                }
            }
        }
        
        # Utiliser la méthode search du client ElasticSearch
        result = await es_client.search(query)
        
        # Extraire les résultats
        aggregations = result.get("aggregations", {})
        skills_agg = aggregations.get("skills", {})
        skill_names_buckets = skills_agg.get("skill_names", {}).get("buckets", [])
        
        # Calculer le total pour les pourcentages
        total = sum(bucket.get("doc_count", 0) for bucket in skill_names_buckets)
        
        # Construire la réponse
        top_skills = []
        for bucket in skill_names_buckets:
            skill_name = bucket.get("key", "")
            count = bucket.get("doc_count", 0)
            percentage = (count / total * 100) if total > 0 else 0.0
            
            top_skills.append(TopSkill(
                name=skill_name,
                count=count,
                percentage=round(percentage, 2)
            ))
        
        return top_skills
    
    except Exception as e:
        # En cas d'erreur, retourner une liste vide
        print(f"Error getting top skills: {str(e)}")
        return []

