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
        
        # FILTER : Tranches d'expérience (OR entre les tranches)
        if search_request.experience_ranges:
            experience_range_filters = []
            for exp_range in search_request.experience_ranges:
                range_query = {"years_of_experience": {"gte": exp_range.min}}
                if exp_range.max is not None:
                    range_query["years_of_experience"]["lte"] = exp_range.max
                experience_range_filters.append({"range": range_query})
            
            if experience_range_filters:
                filter_clauses.append({
                    "bool": {
                        "should": experience_range_filters,
                        "minimum_should_match": 1
                    }
                })
        
        # FILTER : Titre de poste recherché (recherche dans title et main_job)
        if search_request.job_title:
            filter_clauses.append({
                "bool": {
                    "should": [
                        {"match": {"title": {"query": search_request.job_title, "operator": "and"}}},
                        {"match": {"main_job": {"query": search_request.job_title, "operator": "and"}}}
                    ],
                    "minimum_should_match": 1
                }
            })
        
        # FILTER : Disponibilité
        if search_request.availability:
            filter_clauses.append({
                "terms": {
                    "availability": search_request.availability
                }
            })
        
        # FILTER : Niveaux d'étude (nested query sur educations.level)
        if search_request.education_levels:
            education_filters = []
            for edu_level in search_request.education_levels:
                # Normaliser le niveau d'étude (ex: "BAC" -> "Bac", "LICENCE" -> "Licence")
                # Le champ level dans educations peut contenir "Bac", "Bac+2", "Bac+5", etc.
                # On cherche une correspondance partielle
                education_filters.append({
                    "wildcard": {
                        "educations.level": f"*{edu_level.upper()}*"
                    }
                })
            
            if education_filters:
                filter_clauses.append({
                    "nested": {
                        "path": "educations",
                        "query": {
                            "bool": {
                                "should": education_filters,
                                "minimum_should_match": 1
                            }
                        }
                    }
                })
        
        # FILTER : Tranches salariales (range sur salary_expectations)
        if search_request.salary_ranges:
            salary_range_filters = []
            for salary_range in search_request.salary_ranges:
                # Parser les tranches (ex: "0-500k", "500k-1m", "5m+")
                if salary_range == "0-500k":
                    salary_range_filters.append({"range": {"salary_expectations": {"gte": 0, "lt": 500000}}})
                elif salary_range == "500k-1m":
                    salary_range_filters.append({"range": {"salary_expectations": {"gte": 500000, "lt": 1000000}}})
                elif salary_range == "1m-2m":
                    salary_range_filters.append({"range": {"salary_expectations": {"gte": 1000000, "lt": 2000000}}})
                elif salary_range == "2m-3m":
                    salary_range_filters.append({"range": {"salary_expectations": {"gte": 2000000, "lt": 3000000}}})
                elif salary_range == "3m-5m":
                    salary_range_filters.append({"range": {"salary_expectations": {"gte": 3000000, "lt": 5000000}}})
                elif salary_range == "5m+":
                    salary_range_filters.append({"range": {"salary_expectations": {"gte": 5000000}}})
            
            if salary_range_filters:
                filter_clauses.append({
                    "bool": {
                        "should": salary_range_filters,
                        "minimum_should_match": 1
                    }
                })
        
        # FILTER : Langues avec niveaux (nested query sur languages)
        if search_request.languages:
            language_filters = []
            for lang_name, lang_level in search_request.languages.items():
                # Construire une query qui matche la langue ET le niveau minimum
                # Si le niveau demandé est "notions", on accepte tous les niveaux
                # Si c'est "courant", on accepte "courant", "professionnel", "natif"
                # Si c'est "professionnel", on accepte "professionnel", "natif"
                # Si c'est "natif", on accepte seulement "natif"
                min_levels = []
                if lang_level == "notions":
                    min_levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]
                elif lang_level == "courant":
                    min_levels = ["INTERMEDIATE", "ADVANCED", "EXPERT"]
                elif lang_level == "professionnel":
                    min_levels = ["ADVANCED", "EXPERT"]
                elif lang_level == "natif":
                    min_levels = ["EXPERT"]
                else:
                    # Par défaut, utiliser le niveau tel quel
                    min_levels = [lang_level.upper()]
                
                if min_levels:
                    language_filters.append({
                        "bool": {
                            "must": [
                                {"term": {"languages.name": lang_name}}
                            ],
                            "should": [
                                {"term": {"languages.level": level}} for level in min_levels
                            ],
                            "minimum_should_match": 1
                        }
                    })
            
            if language_filters:
                filter_clauses.append({
                    "nested": {
                        "path": "languages",
                        "query": {
                            "bool": {
                                "should": language_filters,
                                "minimum_should_match": 1
                            }
                        }
                    }
                })
        
        # FILTER : Statut VALIDATED (seuls les candidats validés doivent apparaître)
        # Accepter les documents avec status=VALIDATED ou sans champ status (anciens documents indexés)
        # Les documents sans status sont considérés comme validés car ils sont dans l'index
        filter_clauses.append({
            "bool": {
                "should": [
                    {"term": {"status": "VALIDATED"}},
                    {"bool": {"must_not": {"exists": {"field": "status"}}}}
                ],
                "minimum_should_match": 1
            }
        })
        
        # FILTER : Localisation (match partiel pour plus de flexibilité)
        if search_request.location:
            filter_clauses.append({
                "match": {
                    "location": {
                        "query": search_request.location,
                        "operator": "and"
                    }
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

