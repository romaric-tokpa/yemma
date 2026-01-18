"""
Schémas Pydantic pour la validation des données
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# ============================================
# Profile Schemas
# ============================================

class ProfileBase(BaseModel):
    """Schéma de base pour Profile"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_title: Optional[str] = None
    professional_summary: Optional[str] = None


class ProfileCreate(ProfileBase):
    """Schéma pour la création d'un profil"""
    # user_id est rempli automatiquement depuis current_user dans l'endpoint, ne pas l'inclure dans la requête
    email: EmailStr
    # user_id est optionnel car il est rempli automatiquement
    user_id: Optional[int] = None


class ProfileUpdate(BaseModel):
    """Schéma pour la mise à jour d'un profil"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    nationality: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    profile_title: Optional[str] = None
    professional_summary: Optional[str] = None
    sector: Optional[str] = None
    main_job: Optional[str] = None
    total_experience: Optional[int] = None
    photo_url: Optional[str] = None
    last_step_completed: Optional[int] = None
    accept_cgu: Optional[bool] = None
    accept_rgpd: Optional[bool] = None
    accept_verification: Optional[bool] = None
    status: Optional[str] = None  # Permettre la mise à jour du statut par les services internes
    admin_score: Optional[float] = None
    admin_report: Optional[dict] = None
    rejection_reason: Optional[str] = None


class ProfileResponse(ProfileBase):
    """Schéma de réponse pour Profile"""
    id: int
    user_id: int
    email: EmailStr
    status: str
    completion_percentage: float
    admin_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ProfileDetailResponse(ProfileResponse):
    """Schéma de réponse détaillé pour Profile"""
    date_of_birth: Optional[datetime] = None
    nationality: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    sector: Optional[str] = None
    main_job: Optional[str] = None
    total_experience: Optional[int] = None
    admin_report: Optional[Dict[str, Any]] = None
    validated_at: Optional[datetime] = None
    # Relations - définies après pour éviter les forward references
    experiences: List[Dict[str, Any]] = []
    educations: List[Dict[str, Any]] = []
    certifications: List[Dict[str, Any]] = []
    skills: List[Dict[str, Any]] = []
    job_preferences: Optional[Dict[str, Any]] = None


# ============================================
# Experience Schemas
# ============================================

class ExperienceCreate(BaseModel):
    """Schéma pour la création d'une expérience"""
    company_name: str
    company_logo_url: Optional[str] = None
    company_sector: Optional[str] = None
    position: str
    contract_type: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    is_current: bool = False
    description: Optional[str] = None
    achievements: Optional[str] = None
    has_document: bool = False
    document_id: Optional[int] = None


class ExperienceResponse(ExperienceCreate):
    """Schéma de réponse pour Experience"""
    id: int
    profile_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# Education Schemas
# ============================================

class EducationCreate(BaseModel):
    """Schéma pour la création d'une formation"""
    diploma: str
    institution: str
    country: Optional[str] = None
    start_year: Optional[int] = None
    graduation_year: int
    level: str


class EducationResponse(EducationCreate):
    """Schéma de réponse pour Education"""
    id: int
    profile_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# Certification Schemas
# ============================================

class CertificationCreate(BaseModel):
    """Schéma pour la création d'une certification"""
    title: str
    issuer: str
    year: int
    expiration_date: Optional[datetime] = None
    verification_url: Optional[str] = None
    certification_id: Optional[str] = None


class CertificationResponse(CertificationCreate):
    """Schéma de réponse pour Certification"""
    id: int
    profile_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# Skill Schemas
# ============================================

class SkillCreate(BaseModel):
    """Schéma pour la création d'une compétence"""
    skill_type: str
    name: str
    level: Optional[str] = None
    years_of_practice: Optional[int] = None


class SkillResponse(SkillCreate):
    """Schéma de réponse pour Skill"""
    id: int
    profile_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# JobPreference Schemas
# ============================================

class JobPreferenceCreate(BaseModel):
    """Schéma pour la création des préférences"""
    desired_positions: List[str] = Field(default=[], max_length=5)
    contract_type: Optional[str] = None
    target_sectors: List[str] = []
    desired_location: Optional[str] = None
    mobility: Optional[str] = None
    availability: Optional[str] = None
    salary_min: Optional[float] = Field(default=None, description="Salaire minimum (CFA/mois)")
    salary_max: Optional[float] = Field(default=None, description="Salaire maximum (CFA/mois)")
    salary_expectations: Optional[float] = Field(default=None, description="Prétentions salariales (pour compatibilité)")


class JobPreferenceResponse(JobPreferenceCreate):
    """Schéma de réponse pour JobPreference"""
    id: int
    profile_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# Onboarding Schemas
# ============================================

class OnboardingData(BaseModel):
    """Schéma pour les données d'onboarding complètes"""
    step0: Optional[Dict[str, bool]] = None  # Consentements
    step1: Optional[Dict[str, Any]] = None  # Profil général
    step2: Optional[Dict[str, List[Dict[str, Any]]]] = None  # Expériences
    step3: Optional[Dict[str, List[Dict[str, Any]]]] = None  # Formations
    step4: Optional[Dict[str, List[Dict[str, Any]]]] = None  # Certifications
    step5: Optional[Dict[str, Any]] = None  # Compétences
    step6: Optional[Dict[str, Any]] = None  # Documents (métadonnées)
    step7: Optional[Dict[str, Any]] = None  # Préférences
    lastStep: Optional[int] = None


class ProfileSubmitRequest(BaseModel):
    """Schéma pour la soumission d'un profil"""
    pass  # Pas de données supplémentaires nécessaires

