"""
Endpoints de recherche
"""
from typing import List
from fastapi import APIRouter, Query, Depends
from app.domain.schemas import (
    SearchRequest, 
    SearchResponse, 
    SearchResult,
    PostSearchRequest,
    PostSearchResponse,
    PostSearchResult
)
from app.infrastructure.elasticsearch import es_client
from app.infrastructure.search_builder import SearchQueryBuilder
from app.infrastructure.post_search_builder import PostSearchQueryBuilder

router = APIRouter()


@router.get("", response_model=SearchResponse)
async def search_candidates(
    query: str = Query(None, description="Recherche full-text"),
    sectors: str = Query(None, description="Secteurs (séparés par des virgules)"),
    main_jobs: str = Query(None, description="Métiers (séparés par des virgules)"),
    min_experience: int = Query(None, ge=0, description="Expérience minimum (années)"),
    max_experience: int = Query(None, ge=0, description="Expérience maximum (années)"),
    min_admin_score: float = Query(None, ge=0, le=5, description="Score admin minimum"),
    skills: str = Query(None, description="Compétences (séparés par des virgules)"),
    contract_types: str = Query(None, description="Types de contrat (séparés par des virgules)"),
    locations: str = Query(None, description="Localisations (séparés par des virgules)"),
    page: int = Query(1, ge=1, description="Numéro de page"),
    size: int = Query(20, ge=1, le=100, description="Taille de la page"),
):
    """
    Recherche de candidats avec filtres avancés
    
    - **query**: Recherche full-text sur le résumé professionnel et le titre
    - **sectors**: Filtre par secteurs (facette)
    - **main_jobs**: Filtre par métiers (facette)
    - **min_experience / max_experience**: Filtre par années d'expérience
    - **min_admin_score**: Filtre par score admin minimum
    - **skills**: Filtre par compétences (format: "Python" ou "Python:Expert")
      - Format simple: "Python" (recherche par nom seulement)
      - Format avec niveau: "Python:Expert" (recherche précise nom + niveau)
      - Utilise des Nested Queries pour une recherche précise
    - **contract_types**: Filtre par types de contrat
    - **locations**: Filtre par localisations
    - **page / size**: Pagination
    
    Exemple de recherche par compétence avec niveau:
    GET /api/v1/search?skills=Python:Expert,React:Advanced
    """
    # Parser les compétences (format: "Python" ou "Python:Expert")
    parsed_skills = None
    if skills:
        parsed_skills = [s.strip() for s in skills.split(",") if s.strip()]
    
    # Construire la SearchRequest
    search_request = SearchRequest(
        query=query,
        sectors=sectors.split(",") if sectors else None,
        main_jobs=main_jobs.split(",") if main_jobs else None,
        min_experience=min_experience,
        max_experience=max_experience,
        min_admin_score=min_admin_score,
        skills=parsed_skills,
        skills_with_level=None,  # Peut être utilisé via POST avec JSON
        contract_types=contract_types.split(",") if contract_types else None,
        locations=locations.split(",") if locations else None,
        page=page,
        size=size,
    )
    
    # Construire la requête ElasticSearch
    es_query = SearchQueryBuilder.build_query(search_request)
    
    # Exécuter la recherche
    result = await es_client.search(es_query)
    
    # Extraire les résultats
    hits = result.get("hits", {})
    total = hits.get("total", {}).get("value", 0)
    
    results = []
    for hit in hits.get("hits", []):
        source = hit["_source"]
        results.append(SearchResult(
            candidate_id=source.get("candidate_id"),
            profile_title=source.get("profile_title"),
            professional_summary=source.get("professional_summary", "")[:200] + "...",  # Truncate pour l'affichage
            first_name=source.get("first_name"),
            last_name=source.get("last_name"),
            sector=source.get("sector"),
            main_job=source.get("main_job"),
            total_experience=source.get("total_experience", 0),
            admin_score=source.get("admin_score"),
            skills=source.get("skills", []),
            score=hit.get("_score"),
        ))
    
    # Extraire les facettes (agrégations)
    aggregations = result.get("aggregations", {})
    facets = {
        "sectors": [
            {"value": bucket["key"], "count": bucket["doc_count"]}
            for bucket in aggregations.get("sectors", {}).get("buckets", [])
        ],
        "main_jobs": [
            {"value": bucket["key"], "count": bucket["doc_count"]}
            for bucket in aggregations.get("main_jobs", {}).get("buckets", [])
        ],
        "contract_types": [
            {"value": bucket["key"], "count": bucket["doc_count"]}
            for bucket in aggregations.get("contract_types", {}).get("buckets", [])
        ],
        "locations": [
            {"value": bucket["key"], "count": bucket["doc_count"]}
            for bucket in aggregations.get("locations", {}).get("buckets", [])
        ],
        "experience_ranges": [
            {"from": bucket.get("from"), "to": bucket.get("to"), "count": bucket["doc_count"]}
            for bucket in aggregations.get("experience_ranges", {}).get("buckets", [])
        ],
        "admin_score_ranges": [
            {"from": bucket.get("from"), "to": bucket.get("to"), "count": bucket["doc_count"]}
            for bucket in aggregations.get("admin_score_ranges", {}).get("buckets", [])
        ],
    }
    
    return SearchResponse(
        total=total,
        page=page,
        size=size,
        results=results,
        facets=facets,
    )


@router.post("/search", response_model=PostSearchResponse)
async def post_search_candidates(request: PostSearchRequest):
    """
    Recherche de candidats avec requête bool ElasticSearch et highlight
    
    - **query**: Recherche texte libre (fuzzy) sur titre, résumé et compétences
    - **min_experience**: Filtre par expérience minimum (filter, plus performant)
    - **skills**: Filtre par compétences (filter, nested query)
    - **location**: Filtre par localisation (filter, exact match)
    
    Utilise une requête bool avec :
    - **must**: pour le texte libre (recherche floue/fuzzy)
    - **filter**: pour l'expérience et la localisation (plus performant)
    
    Retourne les résultats avec highlight sur les termes recherchés dans le résumé.
    """
    # Construire la requête ElasticSearch avec bool query
    es_query = PostSearchQueryBuilder.build_query(request)
    
    # Exécuter la recherche
    result = await es_client.search(es_query)
    
    # Extraire les résultats avec highlight amélioré
    hits = result.get("hits", {})
    total = hits.get("total", {}).get("value", 0)
    
    results = []
    for hit in hits.get("hits", []):
        source = hit["_source"]
        highlight = hit.get("highlight", {})
        
        # Extraire les highlights (titre, métier principal, résumé)
        title_highlight = None
        if "title" in highlight and highlight["title"]:
            title_highlight = " ".join(highlight["title"])
        
        main_job_highlight = None
        if "main_job" in highlight and highlight["main_job"]:
            main_job_highlight = " ".join(highlight["main_job"])
        
        summary_highlight = None
        if "summary" in highlight and highlight["summary"]:
            summary_highlight = " ".join(highlight["summary"])
        
        # Construire le nom complet
        full_name = source.get("full_name", "")
        
        # Extraire les compétences
        skills = []
        for skill in source.get("skills", []):
            if isinstance(skill, dict):
                skills.append({
                    "name": skill.get("name", ""),
                    "level": skill.get("level", "")
                })
        
        # Utiliser le texte original pour les champs principaux
        title = source.get("title", "")
        main_job = source.get("main_job", "")
        summary = source.get("summary", "")
        
        results.append(PostSearchResult(
            candidate_id=source.get("candidate_id", 0),
            full_name=full_name,
            title=title,
            main_job=main_job,
            summary=summary,
            summary_highlight=summary_highlight,
            title_highlight=title_highlight,
            main_job_highlight=main_job_highlight,
            years_of_experience=source.get("years_of_experience", 0),
            location=source.get("location"),
            skills=skills,
            is_verified=source.get("is_verified", False),
            score=hit.get("_score"),
        ))
    
    return PostSearchResponse(
        total=total,
        page=request.page,
        size=request.size,
        results=results,
    )

