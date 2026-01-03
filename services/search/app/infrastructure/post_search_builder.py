"""
Builder pour construire les requêtes ElasticSearch POST /search
avec bool query, fuzzy search, boosting et highlight amélioré
"""
from typing import Optional, List, Dict, Any
from app.domain.schemas import PostSearchRequest


class PostSearchQueryBuilder:
    """Builder pour construire les requêtes de recherche POST avec highlight"""
    
    # Hiérarchie des niveaux de compétence (du plus bas au plus haut)
    SKILL_LEVEL_HIERARCHY = {
        "BEGINNER": 1,
        "INTERMEDIATE": 2,
        "ADVANCED": 3,
        "EXPERT": 4
    }
    
    @staticmethod
    def get_levels_minimum(min_level: str) -> List[str]:
        """
        Retourne la liste des niveaux >= au niveau minimum
        
        Exemple: get_levels_minimum("ADVANCED") -> ["ADVANCED", "EXPERT"]
        """
        min_level_upper = min_level.upper()
        min_value = PostSearchQueryBuilder.SKILL_LEVEL_HIERARCHY.get(min_level_upper, 0)
        
        levels = []
        for level, value in PostSearchQueryBuilder.SKILL_LEVEL_HIERARCHY.items():
            if value >= min_value:
                levels.append(level)
        
        return levels
    
    @staticmethod
    def build_query(search_request: PostSearchRequest) -> Dict[str, Any]:
        """
        Construit une requête ElasticSearch bool avec :
        - must: pour le texte libre (fuzzy) avec boosting (titre > métier principal > résumé)
        - filter: pour expérience, localisation et compétences (plus performant)
        - highlight: sur titre, métier principal et résumé
        """
        must_clauses = []
        filter_clauses = []
        
        # MUST : Recherche texte libre avec fuzzy et boosting
        # Boosting: titre (3.0) > métier principal (2.5) > résumé (1.0)
        if search_request.query:
            must_clauses.append({
                "bool": {
                    "should": [
                        {
                            "match": {
                                "title": {
                                    "query": search_request.query,
                                    "boost": 3.0,  # Boost le titre (plus important)
                                    "fuzziness": "AUTO",
                                    "operator": "or"
                                }
                            }
                        },
                        {
                            "match": {
                                "main_job": {
                                    "query": search_request.query,
                                    "boost": 2.5,  # Boost le métier principal
                                    "fuzziness": "AUTO",
                                    "operator": "or"
                                }
                            }
                        },
                        {
                            "match": {
                                "summary": {
                                    "query": search_request.query,
                                    "boost": 1.0,  # Résumé avec poids normal
                                    "fuzziness": "AUTO",
                                    "operator": "or"
                                }
                            }
                        },
                        {
                            "nested": {
                                "path": "skills",
                                "query": {
                                    "match": {
                                        "skills.name": {
                                            "query": search_request.query,
                                            "boost": 1.5,  # Boost modéré pour les compétences
                                            "fuzziness": "AUTO",
                                            "operator": "or"
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    "minimum_should_match": 1
                }
            })
        else:
            # Si pas de query, match all
            must_clauses.append({"match_all": {}})
        
        # FILTER : Expérience minimum (plus performant que must)
        if search_request.min_experience is not None:
            filter_clauses.append({
                "range": {
                    "years_of_experience": {
                        "gte": search_request.min_experience
                    }
                }
            })
        
        # FILTER : Localisation (exact match, plus performant)
        if search_request.location:
            filter_clauses.append({
                "term": {
                    "location": search_request.location
                }
            })
        
        # FILTER : Compétences avec Nested Query (nom + niveau minimum)
        # Supporte le format "Python:Expert" pour rechercher Expert ou mieux
        if search_request.skills or search_request.skills_with_level:
            skill_filters = []
            
            # Traiter les compétences au format string (ex: "Python" ou "Python:Expert")
            if search_request.skills:
                for skill_str in search_request.skills:
                    if ":" in skill_str:
                        # Format "Python:Expert" - recherche nom + niveau minimum
                        name, level = skill_str.split(":", 1)
                        name = name.strip()
                        level_normalized = level.strip().upper()
                        
                        # Obtenir tous les niveaux >= au niveau minimum
                        min_levels = PostSearchQueryBuilder.get_levels_minimum(level_normalized)
                        
                        # Construire une query qui matche le nom ET un des niveaux minimum
                        skill_filters.append({
                            "bool": {
                                "must": [
                                    {"term": {"skills.name.keyword": name}}
                                ],
                                "should": [
                                    {"term": {"skills.level": level}} for level in min_levels
                                ],
                                "minimum_should_match": 1
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
                        # Nom + niveau minimum (normaliser en majuscules)
                        level_normalized = skill_filter.level.upper()
                        
                        # Obtenir tous les niveaux >= au niveau minimum
                        min_levels = PostSearchQueryBuilder.get_levels_minimum(level_normalized)
                        
                        # Construire une query qui matche le nom ET un des niveaux minimum
                        skill_filters.append({
                            "bool": {
                                "must": [
                                    {"term": {"skills.name.keyword": skill_filter.name}}
                                ],
                                "should": [
                                    {"term": {"skills.level": level}} for level in min_levels
                                ],
                                "minimum_should_match": 1
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
        
        # Construire la requête bool
        bool_query = {
            "must": must_clauses
        }
        
        if filter_clauses:
            bool_query["filter"] = filter_clauses
        
        # Requête complète avec highlight amélioré
        # Highlight sur titre, métier principal et résumé
        query = {
            "query": {
                "bool": bool_query
            },
            "highlight": {
                "fields": {
                    "title": {
                        "fragment_size": 100,
                        "number_of_fragments": 1,
                        "pre_tags": ["<mark class='highlight'>"],
                        "post_tags": ["</mark>"],
                        "type": "unified"
                    },
                    "main_job": {
                        "fragment_size": 100,
                        "number_of_fragments": 1,
                        "pre_tags": ["<mark class='highlight'>"],
                        "post_tags": ["</mark>"],
                        "type": "unified"
                    },
                    "summary": {
                        "fragment_size": 200,
                        "number_of_fragments": 2,  # 2 fragments pour plus de contexte
                        "pre_tags": ["<mark class='highlight'>"],
                        "post_tags": ["</mark>"],
                        "type": "unified"
                    },
                    "skills.name": {
                        "fragment_size": 50,
                        "number_of_fragments": 1,
                        "pre_tags": ["<mark class='highlight'>"],
                        "post_tags": ["</mark>"]
                    }
                },
                "require_field_match": False,  # Permet le highlight même si le champ n'est pas dans la query
                "boundary_scanner": "word",  # Découpe aux mots
                "boundary_chars": ".,!? \t\n"  # Caractères de délimitation
            },
            "from": (search_request.page - 1) * search_request.size,
            "size": search_request.size,
            "sort": [
                {"_score": {"order": "desc"}},
                {"years_of_experience": {"order": "desc"}}
            ]
        }
        
        return query

