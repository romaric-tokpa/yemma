"""
Modèles du domaine métier (SQLModel) pour le service Candidate
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import JSON as JSONType, ARRAY as ARRAYType, String


class ProfileStatus(str, Enum):
    """Statut du profil candidat"""
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"
    VALIDATED = "VALIDATED"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"


class ContractType(str, Enum):
    """Type de contrat"""
    CDI = "CDI"
    CDD = "CDD"
    STAGE = "STAGE"
    FREELANCE = "FREELANCE"
    ALTERNANCE = "ALTERNANCE"
    INTERIM = "INTERIM"


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


class Profile(SQLModel, table=True):
    """Modèle Profile - Profil principal du candidat"""
    __tablename__ = "profiles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(unique=True, index=True, description="ID utilisateur (auth-service)")
    
    # Informations d'identité
    first_name: Optional[str] = Field(default=None, max_length=100, description="Prénom")
    last_name: Optional[str] = Field(default=None, max_length=100, description="Nom")
    date_of_birth: Optional[datetime] = Field(default=None, description="Date de naissance")
    nationality: Optional[str] = Field(default=None, max_length=100, description="Nationalité")
    photo_url: Optional[str] = Field(default=None, max_length=500, description="URL de la photo")
    
    # Coordonnées
    email: str = Field(index=True, max_length=255, description="Email")
    phone: Optional[str] = Field(default=None, max_length=20, description="Téléphone")
    address: Optional[str] = Field(default=None, max_length=500, description="Adresse")
    city: Optional[str] = Field(default=None, max_length=100, description="Ville")
    country: Optional[str] = Field(default=None, max_length=100, description="Pays")
    
    # Profil professionnel
    profile_title: Optional[str] = Field(default=None, max_length=255, description="Titre du profil")
    professional_summary: Optional[str] = Field(default=None, description="Résumé professionnel")
    sector: Optional[str] = Field(default=None, max_length=100, description="Secteur d'activité")
    main_job: Optional[str] = Field(default=None, max_length=100, description="Métier principal")
    total_experience: Optional[int] = Field(default=0, description="Années d'expérience totale")
    
    # Statut et validation
    status: ProfileStatus = Field(default=ProfileStatus.DRAFT, index=True, description="Statut du profil")
    completion_percentage: Optional[float] = Field(default=0.0, ge=0, le=100, description="Pourcentage de complétion")
    
    # Données admin (après validation)
    admin_score: Optional[float] = Field(default=None, ge=0, le=5, description="Score admin /5")
    admin_report: Optional[dict] = Field(default=None, sa_column=Column(JSONType), description="Rapport admin")
    validated_at: Optional[datetime] = Field(default=None, description="Date de validation")
    rejected_at: Optional[datetime] = Field(default=None, description="Date de rejet")
    rejection_reason: Optional[str] = Field(default=None, description="Motif de rejet")
    
    # Consentements (étape 0)
    accept_cgu: bool = Field(default=False, description="Acceptation CGU")
    accept_rgpd: bool = Field(default=False, description="Acceptation RGPD")
    accept_verification: bool = Field(default=False, description="Autorisation vérification")
    
    # Métadonnées
    last_step_completed: Optional[int] = Field(default=0, description="Dernière étape complétée (0-8)")
    submitted_at: Optional[datetime] = Field(default=None, description="Date de soumission")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    deleted_at: Optional[datetime] = Field(default=None)  # Soft delete
    
    # Relations
    experiences: List["Experience"] = Relationship(back_populates="profile")
    educations: List["Education"] = Relationship(back_populates="profile")
    certifications: List["Certification"] = Relationship(back_populates="profile")
    skills: List["Skill"] = Relationship(back_populates="profile")
    job_preferences: Optional["JobPreference"] = Relationship(back_populates="profile", sa_relationship_kwargs={"uselist": False})


class Experience(SQLModel, table=True):
    """Modèle Experience - Expériences professionnelles"""
    __tablename__ = "experiences"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: int = Field(foreign_key="profiles.id", index=True, description="ID du profil")
    
    company_name: str = Field(max_length=255, description="Nom de l'entreprise")
    company_logo_url: Optional[str] = Field(default=None, max_length=500, description="URL du logo de l'entreprise")
    company_sector: Optional[str] = Field(default=None, max_length=100, description="Secteur d'activité")
    position: str = Field(max_length=255, description="Poste occupé")
    contract_type: Optional[ContractType] = Field(default=None, description="Type de contrat")
    start_date: datetime = Field(description="Date de début")
    end_date: Optional[datetime] = Field(default=None, description="Date de fin")
    is_current: bool = Field(default=False, description="Poste actuel")
    description: Optional[str] = Field(default=None, description="Description des missions")
    achievements: Optional[str] = Field(default=None, description="Réalisations majeures")
    has_document: bool = Field(default=False, description="Expérience justifiable par document")
    document_id: Optional[int] = Field(default=None, description="ID du document justificatif")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relations
    profile: Profile = Relationship(back_populates="experiences")


class Education(SQLModel, table=True):
    """Modèle Education - Formations et diplômes"""
    __tablename__ = "educations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: int = Field(foreign_key="profiles.id", index=True, description="ID du profil")
    
    diploma: str = Field(max_length=255, description="Intitulé du diplôme/formation")
    institution: str = Field(max_length=255, description="Établissement")
    country: Optional[str] = Field(default=None, max_length=100, description="Pays")
    start_year: Optional[int] = Field(default=None, description="Année de début")
    graduation_year: int = Field(description="Année d'obtention")
    level: str = Field(max_length=50, description="Niveau (Bac, Bac+2, Bac+5, etc.)")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relations
    profile: Profile = Relationship(back_populates="educations")


class Certification(SQLModel, table=True):
    """Modèle Certification - Certifications et attestations"""
    __tablename__ = "certifications"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: int = Field(foreign_key="profiles.id", index=True, description="ID du profil")
    
    title: str = Field(max_length=255, description="Intitulé de la certification")
    issuer: str = Field(max_length=255, description="Organisme délivreur")
    year: int = Field(description="Année d'obtention")
    expiration_date: Optional[datetime] = Field(default=None, description="Date d'expiration")
    verification_url: Optional[str] = Field(default=None, max_length=500, description="URL de vérification")
    certification_id: Optional[str] = Field(default=None, max_length=100, description="ID de la certification")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relations
    profile: Profile = Relationship(back_populates="certifications")


class Skill(SQLModel, table=True):
    """Modèle Skill - Compétences"""
    __tablename__ = "skills"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: int = Field(foreign_key="profiles.id", index=True, description="ID du profil")
    
    skill_type: SkillType = Field(index=True, description="Type de compétence")
    name: str = Field(max_length=255, index=True, description="Nom de la compétence")
    level: Optional[SkillLevel] = Field(default=None, description="Niveau (pour techniques)")
    years_of_practice: Optional[int] = Field(default=None, description="Années de pratique")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relations
    profile: Profile = Relationship(back_populates="skills")


class JobPreference(SQLModel, table=True):
    """Modèle JobPreference - Préférences de recherche d'emploi"""
    __tablename__ = "job_preferences"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: int = Field(foreign_key="profiles.id", unique=True, index=True, description="ID du profil")
    
    desired_positions: Optional[List[str]] = Field(default=None, sa_column=Column(ARRAYType(String)), description="Postes recherchés (max 5)")
    contract_type: Optional[ContractType] = Field(default=None, description="Type de contrat souhaité")
    target_sectors: Optional[List[str]] = Field(default=None, sa_column=Column(ARRAYType(String)), description="Secteurs ciblés")
    desired_location: Optional[str] = Field(default=None, max_length=255, description="Localisation souhaitée")
    mobility: Optional[str] = Field(default=None, max_length=100, description="Mobilité géographique")
    availability: Optional[str] = Field(default=None, max_length=100, description="Disponibilité")
    salary_min: Optional[float] = Field(default=None, description="Salaire minimum (CFA/mois)")
    salary_max: Optional[float] = Field(default=None, description="Salaire maximum (CFA/mois)")
    salary_expectations: Optional[float] = Field(default=None, description="Prétentions salariales (pour compatibilité, moyenne de la fourchette)")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relations
    profile: Profile = Relationship(back_populates="job_preferences")

