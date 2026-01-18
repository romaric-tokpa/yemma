"""
Schémas Pydantic pour la validation des données
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SkillDocument(BaseModel):
    """Schéma pour une compétence dans l'index"""
    name: str
    level: str
    years_of_practice: Optional[int] = None


class CandidateDocument(BaseModel):
    """Schéma pour un document candidat dans l'index"""
    candidate_id: int
    profile_title: str
    professional_summary: str
    first_name: str
    last_name: str
    email: str
    sector: str
    main_job: str
    total_experience: int
    admin_score: Optional[float] = None
    skills: List[SkillDocument] = []
    experiences: List[Dict[str, Any]] = []
    educations: List[Dict[str, Any]] = []
    desired_positions: List[str] = []
    contract_type: Optional[str] = None
    desired_location: Optional[str] = None
    availability: Optional[str] = None
    salary_expectations: Optional[int] = None
    status: str = "VALIDATED"
    created_at: Optional[str] = None
    validated_at: Optional[str] = None


class SkillFilter(BaseModel):
    """Schéma pour filtrer une compétence avec nom et niveau"""
    name: str = Field(description="Nom de la compétence")
    level: Optional[str] = Field(None, description="Niveau de la compétence (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)")


class SearchRequest(BaseModel):
    """Schéma de requête de recherche"""
    query: Optional[str] = Field(None, description="Recherche full-text")
    sectors: Optional[List[str]] = Field(None, description="Filtre par secteurs")
    main_jobs: Optional[List[str]] = Field(None, description="Filtre par métiers")
    min_experience: Optional[int] = Field(None, ge=0, description="Expérience minimum (années)")
    max_experience: Optional[int] = Field(None, ge=0, description="Expérience maximum (années)")
    min_admin_score: Optional[float] = Field(None, ge=0, le=5, description="Score admin minimum")
    skills: Optional[List[str]] = Field(None, description="Filtre par compétences (format: 'Python' ou 'Python:Expert')")
    skills_with_level: Optional[List[SkillFilter]] = Field(None, description="Filtre par compétences avec niveau précis")
    contract_types: Optional[List[str]] = Field(None, description="Filtre par types de contrat")
    locations: Optional[List[str]] = Field(None, description="Filtre par localisations")
    page: int = Field(1, ge=1, description="Numéro de page")
    size: int = Field(20, ge=1, le=100, description="Taille de la page")


class ExperienceRange(BaseModel):
    """Schéma pour une tranche d'expérience"""
    min: int = Field(ge=0, description="Années d'expérience minimum")
    max: Optional[int] = Field(None, description="Années d'expérience maximum (None = pas de limite)")


class PostSearchRequest(BaseModel):
    """Schéma de requête POST pour la recherche avec highlight"""
    query: Optional[str] = Field(None, description="Recherche texte libre (titre, résumé, compétences)")
    min_experience: Optional[int] = Field(None, ge=0, description="Expérience minimum (années)")
    experience_ranges: Optional[List[ExperienceRange]] = Field(None, description="Tranches d'expérience")
    skills: Optional[List[str]] = Field(default=[], description="Liste de compétences (format: 'Python' ou 'Python:Expert')")
    skills_with_level: Optional[List[SkillFilter]] = Field(None, description="Filtre par compétences avec niveau précis")
    location: Optional[str] = Field(None, description="Localisation")
    job_title: Optional[str] = Field(None, description="Titre de poste recherché")
    availability: Optional[List[str]] = Field(None, description="Disponibilités (immediate, within_1_month, etc.)")
    education_levels: Optional[List[str]] = Field(None, description="Niveaux d'étude (BAC, BTS, LICENCE, etc.)")
    salary_ranges: Optional[List[str]] = Field(None, description="Tranches salariales (0-500k, 500k-1m, etc.)")
    languages: Optional[Dict[str, str]] = Field(None, description="Langues avec niveaux (ex: {'Français': 'courant'})")
    page: int = Field(1, ge=1, description="Numéro de page")
    size: int = Field(20, ge=1, le=100, description="Taille de la page")


class SearchResult(BaseModel):
    """Schéma de résultat de recherche"""
    candidate_id: int
    profile_title: str
    professional_summary: str
    first_name: str
    last_name: str
    sector: str
    main_job: str
    total_experience: int
    admin_score: Optional[float] = None
    skills: List[Dict[str, Any]] = []
    score: Optional[float] = None  # Score de pertinence ElasticSearch


class PostSearchResult(BaseModel):
    """Schéma de résultat de recherche POST avec highlight"""
    candidate_id: int
    full_name: str
    title: str
    main_job: Optional[str] = None  # Métier principal
    summary: str
    summary_highlight: Optional[str] = None  # Résumé avec highlight
    title_highlight: Optional[str] = None  # Titre avec highlight
    main_job_highlight: Optional[str] = None  # Métier principal avec highlight
    years_of_experience: int
    location: Optional[str] = None
    availability: Optional[str] = None  # Disponibilité du candidat
    skills: List[Dict[str, str]] = []
    is_verified: bool
    photo_url: Optional[str] = None  # Photo de profil du candidat
    score: Optional[float] = None


class PostSearchResponse(BaseModel):
    """Schéma de réponse de recherche POST"""
    total: int
    page: int
    size: int
    results: List[PostSearchResult]


class SearchResponse(BaseModel):
    """Schéma de réponse de recherche"""
    total: int
    page: int
    size: int
    results: List[SearchResult]
    facets: Dict[str, Any] = {}


class IndexRequest(BaseModel):
    """Schéma de requête d'indexation"""
    candidate_id: int
    profile_data: Dict[str, Any]
