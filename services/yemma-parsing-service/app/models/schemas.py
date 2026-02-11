"""
Schemas Pydantic pour le service de parsing CV
Alignés sur le modèle Yemma (CandidateDashboard)
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr


class SkillLevel(str, Enum):
    """Niveau de compétence"""
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class SkillType(str, Enum):
    """Type de compétence"""
    TECHNICAL = "TECHNICAL"
    SOFT = "SOFT"
    TOOL = "TOOL"


class ContractType(str, Enum):
    """Type de contrat"""
    CDI = "CDI"
    CDD = "CDD"
    STAGE = "STAGE"
    FREELANCE = "FREELANCE"
    ALTERNANCE = "ALTERNANCE"
    INTERIM = "INTERIM"


class ParseJobStatus(str, Enum):
    """Statut d'une tâche de parsing"""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ============== Output Schemas (Yemma format) ==============

class SkillOutput(BaseModel):
    """Compétence parsée - Format Yemma"""
    name: str = Field(..., max_length=255, description="Nom de la compétence")
    skill_type: SkillType = Field(default=SkillType.TECHNICAL, description="Type de compétence")
    level: Optional[SkillLevel] = Field(default=None, description="Niveau de maîtrise")
    years_of_practice: Optional[int] = Field(default=None, ge=0, description="Années de pratique")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Python",
                "skill_type": "TECHNICAL",
                "level": "ADVANCED",
                "years_of_practice": 5
            }
        }


class ExperienceOutput(BaseModel):
    """Expérience professionnelle parsée - Format Yemma"""
    company_name: str = Field(..., max_length=255, description="Nom de l'entreprise")
    company_logo_url: Optional[str] = Field(default=None, max_length=500, description="URL du logo")
    company_sector: Optional[str] = Field(default=None, max_length=100, description="Secteur d'activité")
    position: str = Field(..., max_length=255, description="Poste occupé")
    contract_type: Optional[ContractType] = Field(default=None, description="Type de contrat")
    start_date: datetime = Field(..., description="Date de début")
    end_date: Optional[datetime] = Field(default=None, description="Date de fin")
    is_current: bool = Field(default=False, description="Poste actuel")
    description: Optional[str] = Field(default=None, description="Description des missions")
    achievements: Optional[str] = Field(default=None, description="Réalisations majeures")

    class Config:
        json_schema_extra = {
            "example": {
                "company_name": "Google",
                "position": "Software Engineer",
                "start_date": "2020-01-15T00:00:00",
                "end_date": None,
                "is_current": True,
                "description": "Développement d'applications cloud",
                "achievements": "Amélioration des performances de 40%"
            }
        }


class EducationOutput(BaseModel):
    """Formation parsée - Format Yemma"""
    diploma: str = Field(..., max_length=255, description="Intitulé du diplôme")
    institution: str = Field(..., max_length=255, description="Établissement")
    country: Optional[str] = Field(default=None, max_length=100, description="Pays")
    start_year: Optional[int] = Field(default=None, ge=1950, le=2100, description="Année de début")
    graduation_year: int = Field(..., ge=1950, le=2100, description="Année d'obtention")
    level: str = Field(default="Non spécifié", max_length=50, description="Niveau (Bac, Bac+2, etc.)")

    class Config:
        json_schema_extra = {
            "example": {
                "diploma": "Master Informatique",
                "institution": "Université Paris-Saclay",
                "country": "France",
                "start_year": 2018,
                "graduation_year": 2020,
                "level": "Bac+5"
            }
        }


class CertificationOutput(BaseModel):
    """Certification parsée - Format Yemma"""
    title: str = Field(..., max_length=255, description="Intitulé de la certification")
    issuer: str = Field(..., max_length=255, description="Organisme délivreur")
    year: int = Field(..., ge=1950, le=2100, description="Année d'obtention")
    expiration_date: Optional[datetime] = Field(default=None, description="Date d'expiration")
    verification_url: Optional[str] = Field(default=None, max_length=500, description="URL de vérification")
    certification_id: Optional[str] = Field(default=None, max_length=100, description="ID de la certification")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "AWS Solutions Architect",
                "issuer": "Amazon Web Services",
                "year": 2023,
                "expiration_date": None,
                "verification_url": "https://aws.amazon.com/verify/123"
            }
        }


class ProfileOutput(BaseModel):
    """Profil candidat parsé - Format Yemma"""
    # Identité
    first_name: Optional[str] = Field(default=None, max_length=100, description="Prénom")
    last_name: Optional[str] = Field(default=None, max_length=100, description="Nom")
    email: Optional[EmailStr] = Field(default=None, description="Email")
    phone: Optional[str] = Field(default=None, max_length=20, description="Téléphone")
    photo_url: Optional[str] = Field(default=None, max_length=500, description="URL de la photo de profil")

    # Localisation
    address: Optional[str] = Field(default=None, max_length=500, description="Adresse")
    city: Optional[str] = Field(default=None, max_length=100, description="Ville")
    country: Optional[str] = Field(default=None, max_length=100, description="Pays")

    # Profil professionnel
    profile_title: Optional[str] = Field(default=None, max_length=255, description="Titre du profil")
    professional_summary: Optional[str] = Field(default=None, description="Résumé professionnel")
    sector: Optional[str] = Field(default=None, max_length=100, description="Secteur d'activité")
    main_job: Optional[str] = Field(default=None, max_length=100, description="Métier principal")
    total_experience: Optional[int] = Field(default=None, ge=0, description="Années d'expérience totale")

    # Données personnelles
    date_of_birth: Optional[datetime] = Field(default=None, description="Date de naissance")
    nationality: Optional[str] = Field(default=None, max_length=100, description="Nationalité")

    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "Jean",
                "last_name": "Dupont",
                "email": "jean.dupont@email.com",
                "phone": "+33612345678",
                "city": "Paris",
                "country": "France",
                "profile_title": "Développeur Full Stack Senior",
                "professional_summary": "10 ans d'expérience en développement web",
                "total_experience": 10
            }
        }


class ParsedCVResponse(BaseModel):
    """Réponse complète du parsing CV - Format Yemma"""
    profile: ProfileOutput
    experiences: List[ExperienceOutput] = Field(default_factory=list)
    educations: List[EducationOutput] = Field(default_factory=list)
    certifications: List[CertificationOutput] = Field(default_factory=list)
    skills: List[SkillOutput] = Field(default_factory=list)

    # Métadonnées du parsing
    hrflow_profile_key: Optional[str] = Field(default=None, description="Clé du profil HRFlow")
    parsing_confidence: Optional[float] = Field(default=None, ge=0, le=1, description="Score de confiance")
    raw_text_preview: Optional[str] = Field(default=None, max_length=500, description="Aperçu du texte extrait")

    class Config:
        json_schema_extra = {
            "example": {
                "profile": {
                    "first_name": "Jean",
                    "last_name": "Dupont",
                    "email": "jean.dupont@email.com",
                    "profile_title": "Développeur Full Stack"
                },
                "experiences": [],
                "educations": [],
                "skills": [],
                "hrflow_profile_key": "abc123",
                "parsing_confidence": 0.95
            }
        }


# ============== Request Schemas ==============

class ParseJobRequest(BaseModel):
    """Requête de parsing asynchrone"""
    job_id: str = Field(..., description="ID unique du job de parsing")
    status: ParseJobStatus = Field(default=ParseJobStatus.PENDING, description="Statut du job")
    result: Optional[ParsedCVResponse] = Field(default=None, description="Résultat du parsing")
    error: Optional[str] = Field(default=None, description="Message d'erreur si échec")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "parse_abc123",
                "status": "COMPLETED",
                "result": None,
                "error": None
            }
        }


class UploadCVRequest(BaseModel):
    """Métadonnées pour l'upload de CV"""
    user_id: Optional[int] = Field(default=None, description="ID utilisateur (optionnel)")
    email_override: Optional[EmailStr] = Field(default=None, description="Email à utiliser pour le profil")
    sync: bool = Field(default=True, description="Parsing synchrone (True) ou async (False)")
