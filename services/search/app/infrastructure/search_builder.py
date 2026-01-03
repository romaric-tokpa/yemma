"""
Builder pour construire les requêtes ElasticSearch
"""
from typing import Optional, List, Dict, Any
from app.domain.schemas import SearchRequest


class SearchQueryBuilder:
    """Builder pour construire les requêtes de recherche ElasticSearch"""
    
    @staticmethod
    def build_query(search_request: SearchRequest) -> Dict[str, Any]:
        """Construit une requête ElasticSearch à partir d'une SearchRequest"""
        must_clauses = []
        filter_clauses = []
        
        # Recherche full-text sur le résumé professionnel et le titre
        if search_request.query:
            must_clauses.append({
                "multi_match": {
                    "query": search_request.query,
                    "fields": [
                        "professional_summary^3",  # Boost le résumé professionnel
                        "profile_title^2",
                        "main_job",
                        "skills.name"
                    ],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            })
        else:
            # Si pas de query, match all
            must_clauses.append({"match_all": {}})
        
        # Filtres par facettes
        if search_request.sectors:
            filter_clauses.append({
                "terms": {
                    "sector": search_request.sectors
                }
            })
        
        if search_request.main_jobs:
            filter_clauses.append({
                "terms": {
                    "main_job.keyword": search_request.main_jobs
                }
            })
        
        if search_request.min_experience is not None or search_request.max_experience is not None:
            experience_range = {}
            if search_request.min_experience is not None:
                experience_range["gte"] = search_request.min_experience
            if search_request.max_experience is not None:
                experience_range["lte"] = search_request.max_experience
            
            filter_clauses.append({
                "range": {
                    "total_experience": experience_range
                }
            })
        
        if search_request.min_admin_score is not None:
            filter_clauses.append({
                "range": {
                    "admin_score": {
                        "gte": search_request.min_admin_score
                    }
                }
            })
        
        # FILTER : Compétences avec Nested Query (nom + niveau)
        if search_request.skills or search_request.skills_with_level:
            skill_filters = []
            
            # Traiter les compétences au format string (ex: "Python" ou "Python:Expert")
            if search_request.skills:
                for skill_str in search_request.skills:
                    if ":" in skill_str:
                        # Format "Python:Expert" - recherche précise nom + niveau
                        name, level = skill_str.split(":", 1)
                        # Normaliser le niveau en majuscules pour correspondre aux valeurs stockées
                        level_normalized = level.strip().upper()
                        skill_filters.append({
                            "bool": {
                                "must": [
                                    {"term": {"skills.name.keyword": name.strip()}},
                                    {"term": {"skills.level": level_normalized}}
                                ]
                            }
                        })
                    else:
                        # Format "Python" (nom seulement) - recherche par nom uniquement
                        skill_filters.append({
                            "term": {"skills.name.keyword": skill_str.strip()}
                        })
            
            # Traiter les compétences avec niveau explicite
            if search_request.skills_with_level:
                for skill_filter in search_request.skills_with_level:
                    if skill_filter.level:
                        # Nom + niveau (normaliser en majuscules)
                        level_normalized = skill_filter.level.upper()
                        skill_filters.append({
                            "bool": {
                                "must": [
                                    {"term": {"skills.name.keyword": skill_filter.name}},
                                    {"term": {"skills.level": level_normalized}}
                                ]
                            }
                        })
                    else:
                        # Nom seulement
                        skill_filters.append({
                            "term": {"skills.name.keyword": skill_filter.name}
                        })
            
            # Construire la nested query avec bool should (OR entre les compétences)
            if skill_filters:
                filter_clauses.append({
                    "nested": {
                        "path": "skills",
                        "query": {
                            "bool": {
                                "should": skill_filters,
                                "minimum_should_match": 1
                            }
                        }
                    }
                })
        
        if search_request.contract_types:
            filter_clauses.append({
                "terms": {
                    "contract_type": search_request.contract_types
                }
            })
        
        if search_request.locations:
            filter_clauses.append({
                "terms": {
                    "desired_location": search_request.locations
                }
            })
        
        # Construire la requête bool
        bool_query = {
            "must": must_clauses
        }
        
        if filter_clauses:
            bool_query["filter"] = filter_clauses
        
        # Requête complète avec aggrégations (facettes)
        query = {
            "query": {
                "bool": bool_query
            },
            "aggs": {
                "sectors": {
                    "terms": {
                        "field": "sector",
                        "size": 20
                    }
                },
                "main_jobs": {
                    "terms": {
                        "field": "main_job.keyword",
                        "size": 20
                    }
                },
                "contract_types": {
                    "terms": {
                        "field": "contract_type",
                        "size": 10
                    }
                },
                "locations": {
                    "terms": {
                        "field": "desired_location",
                        "size": 20
                    }
                },
                "experience_ranges": {
                    "range": {
                        "field": "total_experience",
                        "ranges": [
                            {"to": 2},
                            {"from": 2, "to": 5},
                            {"from": 5, "to": 10},
                            {"from": 10}
                        ]
                    }
                },
                "admin_score_ranges": {
                    "range": {
                        "field": "admin_score",
                        "ranges": [
                            {"to": 3.0},
                            {"from": 3.0, "to": 4.0},
                            {"from": 4.0, "to": 4.5},
                            {"from": 4.5}
                        ]
                    }
                }
            },
            "from": (search_request.page - 1) * search_request.size,
            "size": search_request.size,
            "sort": [
                {"_score": {"order": "desc"}},
                {"admin_score": {"order": "desc", "missing": "_last"}},
                {"validated_at": {"order": "desc"}}
            ]
        }
        
        return query

