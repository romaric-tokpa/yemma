"""
Endpoints pour l'indexation et la consultation des candidats
"""
from fastapi import APIRouter, HTTPException, status, Request, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import httpx
import logging

from app.infrastructure.candidate_indexer import index_candidate_async, bulk_index_candidates
from app.infrastructure.elasticsearch import es_client
from app.infrastructure.quota_middleware import require_quota_and_log, use_quota, log_access, get_service_token_header
from app.infrastructure.auth import get_current_user, TokenData
from app.infrastructure.internal_auth import verify_internal_token
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


class CandidateIndexRequest(BaseModel):
    """Schéma pour indexer un candidat"""
    candidate_id: int = Field(description="ID du candidat")
    full_name: str = Field(description="Nom complet du candidat")
    title: str = Field(description="Titre du profil")
    skills: List[Dict[str, str]] = Field(
        default=[],
        description="Liste de compétences avec 'name' et 'level'"
    )
    educations: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Liste d'éducations avec 'diploma', 'institution', 'level', 'graduation_year'"
    )
    languages: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="Liste de langues avec 'name' et 'level'"
    )
    years_of_experience: int = Field(default=0, description="Années d'expérience")
    location: str = Field(default="", description="Localisation")
    is_verified: bool = Field(default=False, description="Statut de vérification")
    summary: str = Field(default="", description="Résumé professionnel")
    status: str = Field(default="VALIDATED", description="Statut du candidat (VALIDATED uniquement)")
    main_job: Optional[str] = Field(default=None, description="Métier principal")
    sector: Optional[str] = Field(default=None, description="Secteur d'activité")
    admin_score: Optional[float] = Field(default=None, description="Score admin /5")
    photo_url: Optional[str] = Field(default=None, description="URL de la photo de profil")
    availability: Optional[str] = Field(default=None, description="Disponibilité du candidat")
    
    class Config:
        json_schema_extra = {
            "example": {
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
                "summary": "Développeur expérimenté en Python et React avec 5 ans d'expérience..."
            }
        }


class BulkIndexRequest(BaseModel):
    """Schéma pour indexer plusieurs candidats"""
    candidates: List[CandidateIndexRequest] = Field(description="Liste des candidats à indexer")


@router.post("/index", status_code=status.HTTP_201_CREATED)
async def index_candidate_endpoint(
    request: CandidateIndexRequest,
    service_info: dict = Depends(verify_internal_token)
):
    """
    Indexe un candidat dans ElasticSearch
    
    Utilise la fonction index_candidate() pour convertir les données
    au format ElasticSearch selon le mapping défini.
    
    Endpoint interne - nécessite un token de service.
    """
    try:
        # Convertir la requête en dictionnaire
        candidate_data = request.model_dump()
        
        # Indexer le candidat
        success = await index_candidate_async(candidate_data)
        
        if success:
            return {
                "message": "Candidate indexed successfully",
                "candidate_id": request.candidate_id
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to index candidate"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index candidate: {str(e)}"
        )


@router.post("/index/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_index_candidates_endpoint(
    request: BulkIndexRequest,
    service_info: dict = Depends(verify_internal_token)
):
    """
    Indexe plusieurs candidats en une seule opération (bulk)
    
    Endpoint interne - nécessite un token de service.
    """
    try:
        # Convertir les requêtes en dictionnaires
        candidates_data = [candidate.model_dump() for candidate in request.candidates]
        
        # Indexer en bulk
        result = await bulk_index_candidates(candidates_data)
        
        return {
            "message": "Bulk indexing completed",
            "indexed": result["indexed"],
            "total": result["total"],
            "errors": result["errors"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk index candidates: {str(e)}"
        )


@router.delete("/index/{candidate_id}", status_code=status.HTTP_200_OK)
async def delete_candidate_from_index(
    candidate_id: int,
    service_info: dict = Depends(verify_internal_token)
):
    """
    Supprime un candidat de l'index
    
    Endpoint interne - nécessite un token de service.
    """
    try:
        await es_client.delete_document(str(candidate_id))
        return {
            "message": "Candidate removed from index",
            "candidate_id": candidate_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove candidate from index: {str(e)}"
        )


@router.get("/index/{candidate_id}", status_code=status.HTTP_200_OK)
async def get_candidate_from_index(candidate_id: int):
    """
    Récupère un candidat de l'index (sans protection quota - pour usage interne)
    """
    try:
        await es_client.connect()
        result = await es_client.client.get(
            index="candidates",
            id=str(candidate_id)
        )
        return {
            "candidate_id": candidate_id,
            "document": result["_source"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate not found in index: {str(e)}"
        )


@router.get("/{candidate_id}", status_code=status.HTTP_200_OK)
async def get_candidate_profile(
    candidate_id: int,
    request: Request,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Récupère le profil complet d'un candidat (consultation sécurisée)
    
    Flux de consultation sécurisé :
    1. Vérifie le quota via Payment Service (POST /quotas/check)
    2. Si OK, récupère le profil depuis Candidate Service
    3. Enregistre l'accès via Audit Service
    4. Décrémente le quota via Payment Service (POST /quotas/use)
    
    Le décorateur @require_quota_and_log gère automatiquement :
    - La vérification du quota
    - L'enregistrement de l'accès
    - La décrémentation du quota
    """
    try:
        # Récupérer company_id depuis current_user
        company_id = getattr(current_user, 'company_id', None)
        
        # Récupérer le profil depuis Candidate Service avec un token de service interne
        # Le service candidate nécessite un token de service pour autoriser l'accès aux recruteurs
        try:
            service_headers = get_service_token_header("search-service")
            logger.info(f"Generated service token headers for search-service. Keys: {list(service_headers.keys())}")
            logger.info(f"X-Service-Token present: {'X-Service-Token' in service_headers}, X-Service-Name: {service_headers.get('X-Service-Name')}")
        except Exception as e:
            # Si la génération du token échoue, logger l'erreur et lever une exception
            logger.error(f"Failed to generate service token: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate service token: {str(e)}"
            )
        
        # Logger l'appel au service candidate
        candidate_url = f"{settings.CANDIDATE_SERVICE_URL}/api/v1/profiles/{candidate_id}"
        logger.info(f"Calling candidate service: {candidate_url} with service token for candidate_id={candidate_id}")
        logger.info(f"Sending headers: {list(service_headers.keys())}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                candidate_url,
                headers=service_headers  # Utiliser le token de service interne
            )
            
            # Logger la réponse pour débogage
            logger.info(f"Candidate service response status: {response.status_code} for candidate_id={candidate_id}")
            if response.status_code != 200:
                logger.error(f"Candidate service error response: {response.text}")
                logger.error(f"Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                profile_data = response.json()
                
                # Enrichir avec les données de l'index ElasticSearch si disponible
                try:
                    await es_client.connect()
                    es_result = await es_client.client.get(
                        index=settings.ELASTICSEARCH_INDEX_NAME,
                        id=str(candidate_id)
                    )
                    es_data = es_result.get("_source", {})
                    
                    # Ajouter le score de pertinence et autres métadonnées
                    profile_data["search_metadata"] = {
                        "is_indexed": True,
                        "admin_score": es_data.get("admin_score"),
                        "is_verified": es_data.get("is_verified", False)
                    }
                except Exception:
                    # Si pas dans l'index, ce n'est pas grave
                    profile_data["search_metadata"] = {
                        "is_indexed": False
                    }
                
                # Enregistrer l'accès (non-bloquant) - seulement si company_id est disponible
                if company_id:
                    candidate_email = profile_data.get("email")
                    first_name = profile_data.get("first_name", "")
                    last_name = profile_data.get("last_name", "")
                    candidate_name = f"{first_name} {last_name}".strip() if first_name or last_name else None
                    
                    # Récupérer le nom de l'entreprise
                    company_name = None
                    try:
                        async with httpx.AsyncClient(timeout=3.0) as client2:
                            response2 = await client2.get(
                                f"{settings.COMPANY_SERVICE_URL}/api/v1/companies/{company_id}",
                                headers={"Authorization": request.headers.get("Authorization", "")}
                            )
                            if response2.status_code == 200:
                                company_data = response2.json()
                                company_name = company_data.get("name")
                    except Exception:
                        pass  # Non-bloquant
                    
                    ip_address = request.client.host if request.client else None
                    user_agent = request.headers.get("user-agent")
                    
                    await log_access(
                        recruiter_id=current_user.user_id,
                        recruiter_email=getattr(current_user, 'email', ''),
                        recruiter_name=None,
                        company_id=company_id,
                        company_name=company_name,
                        candidate_id=candidate_id,
                        candidate_email=candidate_email,
                        candidate_name=candidate_name,
                        access_type="profile_view",
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
                    
                    # Décrémenter le quota
                    await use_quota(company_id, "profile_views", amount=1)
                
                return profile_data
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Candidate profile not found"
                )
            elif response.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view this profile"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error fetching candidate profile: {response.text}"
                )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Candidate service timeout"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Candidate service unavailable: {str(e)}"
        )

