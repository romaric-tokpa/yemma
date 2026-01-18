"""
Schémas Pydantic spécifiques pour chaque étape de l'onboarding
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr


# ============================================
# Étape 0 : Conditions & Consentement
# ============================================

class Step0ConsentSchema(BaseModel):
    """Schéma pour l'étape 0 - Consentements"""
    accept_cgu: bool = Field(description="Acceptation des CGU")
    accept_rgpd: bool = Field(description="Consentement RGPD")
    accept_verification: bool = Field(description="Autorisation de vérification des informations")


# ============================================
# Étape 1 : Profil Général / Identité
# ============================================

class Step1IdentitySchema(BaseModel):
    """Schéma pour l'étape 1 - Profil Général / Identité"""
    # Informations d'identité
    first_name: str = Field(description="Prénom")
    last_name: str = Field(description="Nom")
    date_of_birth: Optional[datetime] = Field(None, description="Date de naissance")
    nationality: Optional[str] = Field(None, description="Nationalité")
    photo_url: Optional[str] = Field(None, description="URL de la photo")
    
    # Coordonnées
    email: EmailStr = Field(description="Email")
    phone: Optional[str] = Field(None, description="Téléphone")
    address: Optional[str] = Field(None, description="Adresse")
    city: Optional[str] = Field(None, description="Ville")
    country: Optional[str] = Field(None, description="Pays")
    
    # Profil professionnel
    profile_title: Optional[str] = Field(None, description="Titre du profil")
    professional_summary: Optional[str] = Field(None, description="Résumé professionnel (min 300 caractères)")
    sector: Optional[str] = Field(None, description="Secteur d'activité")
    main_job: Optional[str] = Field(None, description="Métier principal")
    total_experience: Optional[int] = Field(0, description="Années d'expérience totale")


# ============================================
# Étape 2 : Expériences Professionnelles
# ============================================

class Step2ExperienceSchema(BaseModel):
    """Schéma pour une expérience professionnelle"""
    company_name: str = Field(description="Nom de l'entreprise")
    company_logo_url: Optional[str] = Field(None, description="URL du logo de l'entreprise")
    company_sector: Optional[str] = Field(None, description="Secteur d'activité")
    position: str = Field(description="Poste occupé")
    contract_type: Optional[str] = Field(None, description="Type de contrat (CDI, CDD, etc.)")
    start_date: datetime = Field(description="Date de début")
    end_date: Optional[datetime] = Field(None, description="Date de fin")
    is_current: bool = Field(False, description="Poste actuel")
    description: Optional[str] = Field(None, description="Description des missions (HTML)")
    achievements: Optional[str] = Field(None, description="Réalisations majeures (HTML)")
    has_document: bool = Field(False, description="Cette expérience est justifiable par un document")
    document_id: Optional[int] = Field(None, description="ID du document justificatif")


class Step2ExperiencesSchema(BaseModel):
    """Schéma pour l'étape 2 - Expériences Professionnelles"""
    experiences: List[Step2ExperienceSchema] = Field(default=[], description="Liste des expériences")


# ============================================
# Étape 3 : Formations & Diplômes
# ============================================

class Step3EducationSchema(BaseModel):
    """Schéma pour une formation"""
    diploma: str = Field(description="Intitulé du diplôme/formation")
    institution: str = Field(description="Établissement")
    country: Optional[str] = Field(None, description="Pays")
    start_year: Optional[int] = Field(None, description="Année de début")
    graduation_year: int = Field(description="Année d'obtention")
    level: str = Field(description="Niveau (Bac, Bac+2, Bac+5, etc.)")


class Step3EducationsSchema(BaseModel):
    """Schéma pour l'étape 3 - Formations & Diplômes"""
    educations: List[Step3EducationSchema] = Field(default=[], description="Liste des formations")


# ============================================
# Étape 4 : Certifications & Attestations
# ============================================

class Step4CertificationSchema(BaseModel):
    """Schéma pour une certification"""
    title: str = Field(description="Intitulé de la certification")
    issuer: str = Field(description="Organisme délivreur")
    year: int = Field(description="Année d'obtention")
    expiration_date: Optional[datetime] = Field(None, description="Date d'expiration")
    verification_url: Optional[str] = Field(None, description="URL de vérification")
    certification_id: Optional[str] = Field(None, description="ID de la certification")


class Step4CertificationsSchema(BaseModel):
    """Schéma pour l'étape 4 - Certifications & Attestations"""
    certifications: List[Step4CertificationSchema] = Field(default=[], description="Liste des certifications")


# ============================================
# Étape 5 : Compétences
# ============================================

class Step5TechnicalSkillSchema(BaseModel):
    """Schéma pour une compétence technique"""
    name: str = Field(description="Nom de la compétence")
    level: str = Field(description="Niveau (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)")
    years_of_practice: Optional[int] = Field(None, description="Années de pratique")


class Step5ToolSchema(BaseModel):
    """Schéma pour un outil/logiciel"""
    name: str = Field(description="Nom de l'outil")
    level: Optional[str] = Field(None, description="Niveau de maîtrise")


class Step5SkillsSchema(BaseModel):
    """Schéma pour l'étape 5 - Compétences"""
    technical_skills: List[Step5TechnicalSkillSchema] = Field(default=[], description="Compétences techniques")
    soft_skills: List[str] = Field(default=[], description="Compétences comportementales (liste prédéfinie)")
    tools: List[Step5ToolSchema] = Field(default=[], description="Outils & logiciels")


# ============================================
# Étape 6 : Documents Justificatifs
# ============================================

class Step6DocumentsSchema(BaseModel):
    """Schéma pour l'étape 6 - Documents Justificatifs"""
    cv_document_id: Optional[int] = Field(None, description="ID du document CV (obligatoire)")
    # Les autres documents sont gérés via le Document Service
    # Ce schéma sert principalement à valider la présence du CV


# ============================================
# Étape 7 : Recherche d'Emploi & Préférences
# ============================================

class Step7PreferencesSchema(BaseModel):
    """Schéma pour l'étape 7 - Recherche d'Emploi & Préférences"""
    desired_positions: List[str] = Field(default=[], max_length=5, description="Postes recherchés (max 5)")
    contract_type: str = Field(description="Type de contrat souhaité (obligatoire)")
    target_sectors: List[str] = Field(default=[], description="Secteurs ciblés")
    desired_location: str = Field(description="Localisation souhaitée (obligatoire)")
    mobility: Optional[str] = Field(None, description="Mobilité géographique")
    availability: str = Field(description="Disponibilité (obligatoire)")
    salary_expectations: float = Field(description="Prétentions salariales (obligatoire)")


# ============================================
# Schéma unifié pour la sauvegarde partielle
# ============================================

class PartialProfileUpdateSchema(BaseModel):
    """Schéma pour la mise à jour partielle du profil (sauvegarde incrémentale)"""
    # Étape 0
    step0: Optional[Step0ConsentSchema] = None
    
    # Étape 1
    step1: Optional[Step1IdentitySchema] = None
    
    # Étape 2
    step2: Optional[Step2ExperiencesSchema] = None
    
    # Étape 3
    step3: Optional[Step3EducationsSchema] = None
    
    # Étape 4
    step4: Optional[Step4CertificationsSchema] = None
    
    # Étape 5
    step5: Optional[Step5SkillsSchema] = None
    
    # Étape 6 (les documents sont gérés via Document Service)
    step6: Optional[Step6DocumentsSchema] = None
    
    # Étape 7
    step7: Optional[Step7PreferencesSchema] = None
    
    # Métadonnées
    last_step_completed: Optional[int] = Field(None, ge=0, le=8, description="Dernière étape complétée (0-8)")

