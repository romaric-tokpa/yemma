"""
Builder pour construire les requêtes ElasticSearch POST /search
avec function_score, fuzzy search, boosting avancé et filtres optimisés

Améliorations:
- Function score pour booster les profils avec haut score admin
- Boost pour les profils récents
- Recherche multi-champs avec cross_fields
- Fuzzy search amélioré pour tolérer les fautes de frappe
- Synonymes pour les titres de postes courants
- Filtres optimisés pour la performance
"""
from typing import Optional, List, Dict, Any
from app.domain.schemas import PostSearchRequest


class PostSearchQueryBuilder:
    """Builder pour construire les requêtes de recherche POST avec relevance scoring avancé"""

    # Hiérarchie des niveaux de compétence
    SKILL_LEVEL_HIERARCHY = {
        "BEGINNER": 1,
        "DEBUTANT": 1,
        "JUNIOR": 1,
        "INTERMEDIATE": 2,
        "INTERMEDIAIRE": 2,
        "CONFIRMED": 2,
        "CONFIRME": 2,
        "ADVANCED": 3,
        "AVANCE": 3,
        "SENIOR": 3,
        "EXPERT": 4,
    }

    # Mapping des niveaux d'éducation pour une correspondance exacte
    EDUCATION_LEVEL_MAPPING = {
        "BAC": ["BAC", "Bac", "bac", "Baccalauréat", "baccalaureat"],
        "BAC_PLUS_2": ["BAC+2", "Bac+2", "bac+2", "BTS", "DUT", "DEUG"],
        "BAC_PLUS_3": ["BAC+3", "Bac+3", "bac+3", "Licence", "LICENCE", "Bachelor"],
        "BAC_PLUS_4": ["BAC+4", "Bac+4", "bac+4", "Maîtrise", "MAITRISE", "Master 1", "M1"],
        "BAC_PLUS_5": ["BAC+5", "Bac+5", "bac+5", "Master", "MASTER", "Master 2", "M2", "Ingénieur", "INGENIEUR"],
        "DOCTORAT": ["DOCTORAT", "Doctorat", "PhD", "Docteur", "DOCTEUR"],
    }

    # Synonymes pour les titres de postes courants
    JOB_TITLE_SYNONYMS = {
        "dev": ["développeur", "developer", "programmeur"],
        "développeur": ["dev", "developer", "programmeur", "ingénieur logiciel"],
        "fullstack": ["full-stack", "full stack"],
        "frontend": ["front-end", "front end"],
        "backend": ["back-end", "back end"],
        "devops": ["dev ops", "sre", "site reliability"],
        "data scientist": ["data analyst", "ml engineer", "machine learning"],
        "chef de projet": ["project manager", "pm", "responsable projet"],
        "product manager": ["product owner", "po", "chef de produit"],
        "rh": ["ressources humaines", "hr", "human resources"],
        "commercial": ["sales", "business developer", "account manager"],
    }

    @staticmethod
    def get_levels_minimum(min_level: str) -> List[str]:
        """Retourne la liste des niveaux >= au niveau minimum"""
        min_level_upper = min_level.upper()
        min_value = PostSearchQueryBuilder.SKILL_LEVEL_HIERARCHY.get(min_level_upper, 0)

        levels = []
        for level, value in PostSearchQueryBuilder.SKILL_LEVEL_HIERARCHY.items():
            if value >= min_value:
                levels.append(level)

        return levels

    @staticmethod
    def get_education_variants(level: str) -> List[str]:
        """Retourne toutes les variantes d'un niveau d'éducation"""
        level_upper = level.upper().replace(" ", "_").replace("+", "_PLUS_")
        return PostSearchQueryBuilder.EDUCATION_LEVEL_MAPPING.get(level_upper, [level])

    @staticmethod
    def expand_job_title_synonyms(query: str) -> str:
        """Étend la requête avec les synonymes de titres de postes"""
        query_lower = query.lower()
        for term, synonyms in PostSearchQueryBuilder.JOB_TITLE_SYNONYMS.items():
            if term in query_lower:
                # Ajouter les synonymes à la requête
                return f"{query} {' '.join(synonyms)}"
        return query

    @staticmethod
    def build_query(search_request: PostSearchRequest) -> Dict[str, Any]:
        """
        Construit une requête ElasticSearch optimisée pour les recruteurs avec:
        - function_score pour booster les meilleurs profils
        - Recherche multi-champs intelligente
        - Filtres performants
        - Tri par pertinence puis qualité du profil
        """
        must_clauses = []
        should_clauses = []  # Pour booster certains résultats sans les exclure
        filter_clauses = []

        # ============================================
        # RECHERCHE TEXTE LIBRE (query)
        # ============================================
        if search_request.query:
            expanded_query = PostSearchQueryBuilder.expand_job_title_synonyms(search_request.query)

            must_clauses.append({
                "bool": {
                    "should": [
                        # Correspondance exacte de phrase (boost maximum)
                        {
                            "multi_match": {
                                "query": search_request.query,
                                "fields": ["title^4", "main_job^3", "full_name^2"],
                                "type": "phrase",
                                "boost": 5.0
                            }
                        },
                        # Correspondance multi-champs avec cross_fields
                        {
                            "multi_match": {
                                "query": expanded_query,
                                "fields": [
                                    "title^3",
                                    "main_job^2.5",
                                    "summary^1.5",
                                    "full_name^2"
                                ],
                                "type": "cross_fields",
                                "operator": "or",
                                "minimum_should_match": "50%",
                                "fuzziness": "AUTO",
                                "prefix_length": 2,
                                "boost": 2.0
                            }
                        },
                        # Recherche dans les compétences
                        {
                            "nested": {
                                "path": "skills",
                                "query": {
                                    "match": {
                                        "skills.name": {
                                            "query": search_request.query,
                                            "fuzziness": "AUTO",
                                            "prefix_length": 2,
                                            "boost": 1.5
                                        }
                                    }
                                }
                            }
                        },
                        # Recherche dans les expériences (postes occupés)
                        {
                            "nested": {
                                "path": "experiences",
                                "query": {
                                    "match": {
                                        "experiences.position": {
                                            "query": search_request.query,
                                            "fuzziness": "AUTO",
                                            "boost": 1.0
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    "minimum_should_match": 1
                }
            })

        # ============================================
        # FILTRE TITRE DE POSTE (job_title)
        # ============================================
        if search_request.job_title:
            expanded_title = PostSearchQueryBuilder.expand_job_title_synonyms(search_request.job_title)

            filter_clauses.append({
                "bool": {
                    "should": [
                        # Correspondance exacte phrase
                        {
                            "multi_match": {
                                "query": search_request.job_title,
                                "fields": ["title", "main_job"],
                                "type": "phrase_prefix"
                            }
                        },
                        # Correspondance avec synonymes et fuzzy
                        {
                            "multi_match": {
                                "query": expanded_title,
                                "fields": ["title^2", "main_job^1.5"],
                                "type": "best_fields",
                                "fuzziness": "AUTO",
                                "prefix_length": 2,
                                "minimum_should_match": "60%"
                            }
                        },
                        # Recherche dans les positions des expériences
                        {
                            "nested": {
                                "path": "experiences",
                                "query": {
                                    "match": {
                                        "experiences.position": {
                                            "query": search_request.job_title,
                                            "fuzziness": "AUTO"
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    "minimum_should_match": 1
                }
            })

        # ============================================
        # FILTRE EXPÉRIENCE (min/max)
        # ============================================
        if search_request.min_experience is not None or search_request.max_experience is not None:
            range_filter = {"years_of_experience": {}}
            if search_request.min_experience is not None:
                range_filter["years_of_experience"]["gte"] = search_request.min_experience
            if search_request.max_experience is not None:
                range_filter["years_of_experience"]["lte"] = search_request.max_experience
            filter_clauses.append({"range": range_filter})

        # ============================================
        # FILTRE TRANCHES D'EXPÉRIENCE
        # ============================================
        if search_request.experience_ranges:
            exp_filters = []
            for exp_range in search_request.experience_ranges:
                range_q = {"years_of_experience": {"gte": exp_range.min}}
                if exp_range.max is not None:
                    range_q["years_of_experience"]["lte"] = exp_range.max
                exp_filters.append({"range": range_q})

            if exp_filters:
                filter_clauses.append({
                    "bool": {"should": exp_filters, "minimum_should_match": 1}
                })

        # ============================================
        # FILTRE COMPÉTENCES (avec fuzzy search)
        # ============================================
        if search_request.skills or search_request.skills_with_level:
            skill_filters = []

            if search_request.skills:
                for skill_str in search_request.skills:
                    if ":" in skill_str:
                        name, level = skill_str.split(":", 1)
                        name = name.strip()
                        min_levels = PostSearchQueryBuilder.get_levels_minimum(level.strip())

                        skill_filters.append({
                            "bool": {
                                "must": [
                                    {
                                        "match": {
                                            "skills.name": {
                                                "query": name,
                                                "fuzziness": "AUTO",
                                                "prefix_length": 2
                                            }
                                        }
                                    }
                                ],
                                "should": [
                                    {"term": {"skills.level": lvl}} for lvl in min_levels
                                ],
                                "minimum_should_match": 1 if min_levels else 0
                            }
                        })
                    else:
                        # Recherche de compétence avec fuzzy
                        skill_filters.append({
                            "match": {
                                "skills.name": {
                                    "query": skill_str.strip(),
                                    "fuzziness": "AUTO",
                                    "prefix_length": 2,
                                    "operator": "and"
                                }
                            }
                        })

            if search_request.skills_with_level:
                for skill_filter in search_request.skills_with_level:
                    if skill_filter.level:
                        min_levels = PostSearchQueryBuilder.get_levels_minimum(skill_filter.level)
                        skill_filters.append({
                            "bool": {
                                "must": [
                                    {
                                        "match": {
                                            "skills.name": {
                                                "query": skill_filter.name,
                                                "fuzziness": "AUTO",
                                                "prefix_length": 2
                                            }
                                        }
                                    }
                                ],
                                "should": [
                                    {"term": {"skills.level": lvl}} for lvl in min_levels
                                ],
                                "minimum_should_match": 1 if min_levels else 0
                            }
                        })
                    else:
                        skill_filters.append({
                            "match": {
                                "skills.name": {
                                    "query": skill_filter.name,
                                    "fuzziness": "AUTO",
                                    "prefix_length": 2
                                }
                            }
                        })

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

        # ============================================
        # FILTRE LOCALISATION (fuzzy + flexible)
        # ============================================
        if search_request.location:
            filter_clauses.append({
                "bool": {
                    "should": [
                        # Correspondance exacte
                        {"term": {"location": search_request.location}},
                        # Correspondance partielle avec fuzzy
                        {
                            "match": {
                                "location": {
                                    "query": search_request.location,
                                    "fuzziness": "AUTO",
                                    "prefix_length": 2,
                                    "operator": "or"
                                }
                            }
                        },
                        # Recherche dans desired_location également
                        {
                            "match": {
                                "desired_location": {
                                    "query": search_request.location,
                                    "fuzziness": "AUTO"
                                }
                            }
                        }
                    ],
                    "minimum_should_match": 1
                }
            })

        # ============================================
        # FILTRE DISPONIBILITÉ
        # ============================================
        if search_request.availability:
            filter_clauses.append({
                "terms": {"availability": search_request.availability}
            })

        # ============================================
        # FILTRE NIVEAU D'ÉDUCATION (optimisé)
        # ============================================
        if search_request.education_levels:
            education_terms = []
            for edu_level in search_request.education_levels:
                variants = PostSearchQueryBuilder.get_education_variants(edu_level)
                education_terms.extend(variants)

            if education_terms:
                filter_clauses.append({
                    "nested": {
                        "path": "educations",
                        "query": {
                            "bool": {
                                "should": [
                                    {"terms": {"educations.level": education_terms}},
                                    # Fallback avec match pour les variantes non listées
                                    {
                                        "bool": {
                                            "should": [
                                                {"match": {"educations.level": term}}
                                                for term in education_terms[:5]  # Limiter pour la perf
                                            ]
                                        }
                                    }
                                ],
                                "minimum_should_match": 1
                            }
                        }
                    }
                })

        # ============================================
        # FILTRE TRANCHES SALARIALES
        # ============================================
        if search_request.salary_ranges:
            salary_filters = []
            salary_mapping = {
                "0-500k": (0, 500000),
                "500k-1m": (500000, 1000000),
                "1m-2m": (1000000, 2000000),
                "2m-3m": (2000000, 3000000),
                "3m-5m": (3000000, 5000000),
                "5m+": (5000000, None),
            }

            for salary_range in search_request.salary_ranges:
                if salary_range in salary_mapping:
                    min_sal, max_sal = salary_mapping[salary_range]
                    range_q = {"salary_expectations": {"gte": min_sal}}
                    if max_sal:
                        range_q["salary_expectations"]["lt"] = max_sal
                    salary_filters.append({"range": range_q})

            if salary_filters:
                filter_clauses.append({
                    "bool": {"should": salary_filters, "minimum_should_match": 1}
                })

        # ============================================
        # FILTRE LANGUES
        # ============================================
        if search_request.languages:
            language_filters = []
            level_mapping = {
                "notions": ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"],
                "courant": ["INTERMEDIATE", "ADVANCED", "EXPERT"],
                "professionnel": ["ADVANCED", "EXPERT"],
                "natif": ["EXPERT"],
            }

            for lang_name, lang_level in search_request.languages.items():
                min_levels = level_mapping.get(lang_level.lower(), [lang_level.upper()])
                language_filters.append({
                    "bool": {
                        "must": [{"term": {"languages.name": lang_name}}],
                        "should": [{"term": {"languages.level": lvl}} for lvl in min_levels],
                        "minimum_should_match": 1
                    }
                })

            if language_filters:
                filter_clauses.append({
                    "nested": {
                        "path": "languages",
                        "query": {"bool": {"should": language_filters, "minimum_should_match": 1}}
                    }
                })

        # ============================================
        # FILTRE SCORE ADMIN MINIMUM
        # ============================================
        if search_request.min_admin_score is not None:
            filter_clauses.append({
                "range": {"admin_score": {"gte": search_request.min_admin_score}}
            })

        # ============================================
        # FILTRE TYPES DE CONTRAT
        # ============================================
        if search_request.contract_types:
            filter_clauses.append({
                "terms": {"contract_type": search_request.contract_types}
            })

        # ============================================
        # FILTRE SECTEUR
        # ============================================
        if search_request.sector:
            filter_clauses.append({
                "bool": {
                    "should": [
                        {"term": {"sector": search_request.sector}},
                        {"match": {"sector": {"query": search_request.sector, "fuzziness": "AUTO"}}}
                    ],
                    "minimum_should_match": 1
                }
            })

        # ============================================
        # FILTRE STATUT VALIDÉ (obligatoire)
        # ============================================
        filter_clauses.append({
            "bool": {
                "should": [
                    {"term": {"status": "VALIDATED"}},
                    {"bool": {"must_not": {"exists": {"field": "status"}}}}
                ],
                "minimum_should_match": 1
            }
        })

        # ============================================
        # CONSTRUCTION DE LA REQUÊTE PRINCIPALE
        # ============================================

        # Si pas de query texte, match_all avec boost par qualité
        if not must_clauses:
            must_clauses.append({"match_all": {}})

        bool_query = {"must": must_clauses}
        if filter_clauses:
            bool_query["filter"] = filter_clauses
        if should_clauses:
            bool_query["should"] = should_clauses

        # ============================================
        # FUNCTION SCORE pour améliorer la pertinence
        # ============================================
        # Booster les profils avec:
        # - Haut score admin (qualité validée par l'équipe)
        # - Profils récemment validés (fraîcheur)
        # - Profils vérifiés

        function_score_query = {
            "function_score": {
                "query": {"bool": bool_query},
                "functions": [
                    # Boost basé sur le score admin (1.0 à 2.0x)
                    {
                        "script_score": {
                            "script": {
                                "source": """
                                    if (doc['admin_score'].size() > 0 && doc['admin_score'].value != null) {
                                        return 1.0 + (doc['admin_score'].value / 5.0);
                                    }
                                    return 1.0;
                                """
                            }
                        },
                        "weight": 1.5
                    },
                    # Boost pour les profils vérifiés
                    {
                        "filter": {"term": {"is_verified": True}},
                        "weight": 1.2
                    },
                    # Léger boost pour les profils avec plus d'expérience
                    {
                        "script_score": {
                            "script": {
                                "source": """
                                    if (doc['years_of_experience'].size() > 0) {
                                        double exp = doc['years_of_experience'].value;
                                        return 1.0 + Math.min(exp / 20.0, 0.3);
                                    }
                                    return 1.0;
                                """
                            }
                        },
                        "weight": 0.5
                    },
                    # Boost pour les profils récemment validés (decay)
                    {
                        "gauss": {
                            "validated_at": {
                                "origin": "now",
                                "scale": "90d",
                                "offset": "7d",
                                "decay": 0.5
                            }
                        },
                        "weight": 0.3
                    }
                ],
                "score_mode": "multiply",
                "boost_mode": "multiply",
                "max_boost": 5.0
            }
        }

        # ============================================
        # REQUÊTE FINALE AVEC HIGHLIGHT
        # ============================================
        query = {
            "query": function_score_query,
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
                        "number_of_fragments": 2,
                        "pre_tags": ["<mark class='highlight'>"],
                        "post_tags": ["</mark>"],
                        "type": "unified"
                    },
                    "skills.name": {
                        "fragment_size": 50,
                        "number_of_fragments": 3,
                        "pre_tags": ["<mark class='highlight'>"],
                        "post_tags": ["</mark>"]
                    },
                    "location": {
                        "fragment_size": 50,
                        "number_of_fragments": 1,
                        "pre_tags": ["<mark class='highlight'>"],
                        "post_tags": ["</mark>"]
                    }
                },
                "require_field_match": False,
                "boundary_scanner": "word"
            },
            "from": (search_request.page - 1) * search_request.size,
            "size": search_request.size,
            "sort": [
                {"_score": {"order": "desc"}},
                {"admin_score": {"order": "desc", "missing": "_last"}},
                {"years_of_experience": {"order": "desc"}}
            ],
            # Agrégations pour les facettes (optionnel mais utile)
            "aggs": {
                "availability_counts": {
                    "terms": {"field": "availability", "size": 10}
                },
                "contract_type_counts": {
                    "terms": {"field": "contract_type", "size": 10}
                },
                "sector_counts": {
                    "terms": {"field": "sector", "size": 15}
                },
                "experience_ranges": {
                    "range": {
                        "field": "years_of_experience",
                        "ranges": [
                            {"key": "0-2", "from": 0, "to": 3},
                            {"key": "3-5", "from": 3, "to": 6},
                            {"key": "6-10", "from": 6, "to": 11},
                            {"key": "10+", "from": 10}
                        ]
                    }
                },
                "avg_admin_score": {
                    "avg": {"field": "admin_score"}
                }
            }
        }

        return query
