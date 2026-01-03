"""
Endpoints API pour la gestion des profils candidats
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, TokenData
from app.infrastructure.internal_auth import verify_internal_token
from app.infrastructure.repositories import (
    ProfileRepository, ExperienceRepository, EducationRepository,
    CertificationRepository, SkillRepository, JobPreferenceRepository
)
from app.domain.models import ProfileStatus
from app.domain.schemas import (
    ProfileResponse, ProfileDetailResponse, ProfileCreate, ProfileUpdate,
    ExperienceCreate, ExperienceResponse,
    EducationCreate, EducationResponse,
    CertificationCreate, CertificationResponse,
    SkillCreate, SkillResponse,
    JobPreferenceCreate, JobPreferenceResponse,
    ProfileSubmitRequest
)
from app.domain.onboarding_schemas import PartialProfileUpdateSchema
from app.core.exceptions import (
    ProfileNotFoundError, ProfileAlreadyExistsError,
    InvalidProfileStatusError, ProfileNotCompleteError
)
from app.core.completion import can_submit_profile

router = APIRouter(prefix="/profiles", tags=["profiles"])


# ============================================
# Profile Endpoints
# ============================================

@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: ProfileCreate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Crée un nouveau profil candidat"""
    # Vérifier qu'un profil n'existe pas déjà pour cet utilisateur
    existing = await ProfileRepository.get_by_user_id(session, current_user.user_id)
    if existing:
        raise ProfileAlreadyExistsError(str(current_user.user_id))
    
    # Créer le profil
    profile_dict = profile_data.model_dump()
    profile_dict["user_id"] = current_user.user_id
    profile = await ProfileRepository.create(session, profile_dict)
    
    return ProfileResponse.model_validate(profile)


@router.get("/me")
async def get_my_profile(
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Récupère le profil de l'utilisateur connecté"""
    profile = await ProfileRepository.get_by_user_id(session, current_user.user_id)
    if not profile:
        raise ProfileNotFoundError(str(current_user.user_id))
    
    profile = await ProfileRepository.get_with_relations(session, profile.id)
    
    # Construire la réponse avec les relations
    response_data = ProfileResponse.model_validate(profile).model_dump()
    
    # Ajouter les relations
    response_data["experiences"] = [ExperienceResponse.model_validate(exp).model_dump() for exp in profile.experiences]
    response_data["educations"] = [EducationResponse.model_validate(edu).model_dump() for edu in profile.educations]
    response_data["certifications"] = [CertificationResponse.model_validate(cert).model_dump() for cert in profile.certifications]
    response_data["skills"] = [SkillResponse.model_validate(skill).model_dump() for skill in profile.skills]
    if profile.job_preferences:
        response_data["job_preferences"] = JobPreferenceResponse.model_validate(profile.job_preferences).model_dump()
    
    # Ajouter les champs supplémentaires
    response_data.update({
        "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
        "nationality": profile.nationality,
        "phone": profile.phone,
        "address": profile.address,
        "city": profile.city,
        "country": profile.country,
        "sector": profile.sector,
        "main_job": profile.main_job,
        "total_experience": profile.total_experience,
        "admin_report": profile.admin_report,
        "validated_at": profile.validated_at.isoformat() if profile.validated_at else None,
    })
    
    return response_data


@router.patch("/me", response_model=ProfileResponse)
async def partial_update_my_profile(
    update_data: PartialProfileUpdateSchema,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Met à jour partiellement le profil de l'utilisateur connecté (sauvegarde incrémentale)
    
    Permet une sauvegarde partielle à chaque étape de l'onboarding.
    Si un utilisateur envoie uniquement les données de l'étape 2, seuls ces champs seront mis à jour.
    
    Structure attendue :
    - step0: Consentements (CGU, RGPD, vérification)
    - step1: Profil général / Identité
    - step2: Expériences professionnelles
    - step3: Formations & Diplômes
    - step4: Certifications & Attestations
    - step5: Compétences
    - step6: Documents (métadonnées, le CV est géré via Document Service)
    - step7: Préférences de recherche d'emploi
    - last_step_completed: Dernière étape complétée (0-8)
    """
    from app.infrastructure.repositories import (
        ExperienceRepository, EducationRepository, CertificationRepository,
        SkillRepository, JobPreferenceRepository
    )
    
    profile = await ProfileRepository.get_by_user_id(session, current_user.user_id)
    if not profile:
        raise ProfileNotFoundError(str(current_user.user_id))
    
    # Vérifier le statut (on ne peut modifier que les profils DRAFT ou REJECTED)
    if profile.status not in [ProfileStatus.DRAFT, ProfileStatus.REJECTED]:
        raise InvalidProfileStatusError(
            profile.status.value,
            "DRAFT or REJECTED"
        )
    
    profile_update_data = {}
    
    # Étape 0 : Consentements
    if update_data.step0:
        profile_update_data.update({
            "accept_cgu": update_data.step0.accept_cgu,
            "accept_rgpd": update_data.step0.accept_rgpd,
            "accept_verification": update_data.step0.accept_verification
        })
    
    # Étape 1 : Profil Général / Identité
    if update_data.step1:
        step1_dict = update_data.step1.model_dump(exclude_unset=True, exclude_none=True)
        profile_update_data.update(step1_dict)
    
    # Étape 2 : Expériences Professionnelles
    if update_data.step2:
        # Supprimer toutes les expériences existantes et les recréer
        existing_experiences = await ExperienceRepository.get_by_profile_id(session, profile.id)
        for exp in existing_experiences:
            await ExperienceRepository.delete(session, exp.id)
        
        # Créer les nouvelles expériences
        for exp_data in update_data.step2.experiences:
            exp_dict = exp_data.model_dump(exclude_unset=True)
            exp_dict["profile_id"] = profile.id
            await ExperienceRepository.create(session, exp_dict)
    
    # Étape 3 : Formations & Diplômes
    if update_data.step3:
        # Supprimer toutes les formations existantes et les recréer
        existing_educations = await EducationRepository.get_by_profile_id(session, profile.id)
        for edu in existing_educations:
            await EducationRepository.delete(session, edu.id)
        
        # Créer les nouvelles formations
        for edu_data in update_data.step3.educations:
            edu_dict = edu_data.model_dump(exclude_unset=True)
            edu_dict["profile_id"] = profile.id
            await EducationRepository.create(session, edu_dict)
    
    # Étape 4 : Certifications & Attestations
    if update_data.step4:
        # Supprimer toutes les certifications existantes et les recréer
        existing_certifications = await CertificationRepository.get_by_profile_id(session, profile.id)
        for cert in existing_certifications:
            await CertificationRepository.delete(session, cert.id)
        
        # Créer les nouvelles certifications
        for cert_data in update_data.step4.certifications:
            cert_dict = cert_data.model_dump(exclude_unset=True)
            cert_dict["profile_id"] = profile.id
            await CertificationRepository.create(session, cert_dict)
    
    # Étape 5 : Compétences
    if update_data.step5:
        # Supprimer toutes les compétences existantes et les recréer
        existing_skills = await SkillRepository.get_by_profile_id(session, profile.id)
        for skill in existing_skills:
            await SkillRepository.delete(session, skill.id)
        
        # Créer les compétences techniques
        for tech_skill in update_data.step5.technical_skills:
            skill_dict = tech_skill.model_dump(exclude_unset=True)
            skill_dict["profile_id"] = profile.id
            skill_dict["skill_type"] = "technical"
            await SkillRepository.create(session, skill_dict)
        
        # Créer les compétences comportementales
        for soft_skill_name in update_data.step5.soft_skills:
            skill_dict = {
                "profile_id": profile.id,
                "skill_type": "soft",
                "name": soft_skill_name
            }
            await SkillRepository.create(session, skill_dict)
        
        # Créer les outils/logiciels
        for tool in update_data.step5.tools:
            skill_dict = tool.model_dump(exclude_unset=True)
            skill_dict["profile_id"] = profile.id
            skill_dict["skill_type"] = "tool"
            await SkillRepository.create(session, skill_dict)
    
    # Étape 6 : Documents (métadonnées uniquement, l'upload est géré via Document Service)
    # Cette étape ne nécessite pas de mise à jour dans le profil, le CV est vérifié via Document Service
    
    # Étape 7 : Préférences de recherche d'emploi
    if update_data.step7:
        pref_dict = update_data.step7.model_dump(exclude_unset=True)
        await JobPreferenceRepository.create_or_update(session, profile.id, pref_dict)
    
    # Mettre à jour last_step_completed si fourni
    if update_data.last_step_completed is not None:
        profile_update_data["last_step_completed"] = update_data.last_step_completed
    
    # Mettre à jour le profil principal si nécessaire
    if profile_update_data:
        updated_profile = await ProfileRepository.update(
            session,
            profile.id,
            profile_update_data
        )
    else:
        # Recharger le profil avec les relations pour recalculer le completion_percentage
        updated_profile = await ProfileRepository.get_with_relations(session, profile.id)
        if updated_profile:
            from app.core.completion import check_cv_exists, calculate_completion_percentage
            has_cv = await check_cv_exists(profile.id)
            updated_profile.completion_percentage = calculate_completion_percentage(updated_profile, has_cv=has_cv)
            from datetime import datetime
            updated_profile.updated_at = datetime.utcnow()
            await session.commit()
            await session.refresh(updated_profile)
    
    if not updated_profile:
        raise ProfileNotFoundError(str(profile.id))
    
    return ProfileResponse.model_validate(updated_profile)


@router.get("/{profile_id}", response_model=ProfileDetailResponse)
async def get_profile(
    profile_id: int,
    session: AsyncSession = Depends(get_session),
    service_info: Optional[dict] = Depends(verify_internal_token),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    Récupère un profil par ID
    
    Accepte soit un token utilisateur (Bearer) soit un token de service (X-Service-Token).
    Si un token de service est fourni, les vérifications de permissions utilisateur sont ignorées.
    """
    profile = await ProfileRepository.get_with_relations(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    # Si c'est un appel inter-service (service_info est présent), autoriser l'accès
    # Sinon, vérifier les permissions utilisateur
    if not service_info:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        if profile.user_id != current_user.user_id and "ROLE_ADMIN" not in current_user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this profile"
            )
    
    return ProfileDetailResponse.model_validate(profile)


@router.put("/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: int,
    update_data: ProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user),
    service_info: Optional[dict] = Depends(verify_internal_token)
):
    """
    Met à jour un profil
    
    Accepte soit un token utilisateur (Bearer) soit un token de service (X-Service-Token).
    Si un token de service est fourni, les vérifications de permissions utilisateur sont ignorées.
    """
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    # Si c'est un appel inter-service (service_info est présent), autoriser l'accès
    # Sinon, vérifier les permissions utilisateur
    if not service_info:
        if profile.user_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this profile"
            )
    
    # Vérifier le statut
    if profile.status not in [ProfileStatus.DRAFT, ProfileStatus.REJECTED]:
        raise InvalidProfileStatusError(
            profile.status.value,
            "DRAFT or REJECTED"
        )
    
    updated_profile = await ProfileRepository.update(
        session,
        profile_id,
        update_data.model_dump(exclude_unset=True)
    )
    
    if not updated_profile:
        raise ProfileNotFoundError(str(profile_id))
    
    return ProfileResponse.model_validate(updated_profile)


@router.post("/{profile_id}/submit", response_model=ProfileResponse)
async def submit_profile(
    profile_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Soumet un profil pour validation"""
    profile = await ProfileRepository.get_with_relations(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    # Vérifier les permissions
    if profile.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit this profile"
        )
    
    try:
        submitted_profile = await ProfileRepository.submit_for_validation(
            session,
            profile_id
        )
        if not submitted_profile:
            raise ProfileNotFoundError(str(profile_id))
        
        return ProfileResponse.model_validate(submitted_profile)
    except ValueError as e:
        raise ProfileNotCompleteError(str(e))


# ============================================
# Experience Endpoints
# ============================================

@router.post("/{profile_id}/experiences", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
async def create_experience(
    profile_id: int,
    experience_data: ExperienceCreate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Crée une expérience pour un profil"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    experience_dict = experience_data.model_dump()
    experience_dict["profile_id"] = profile_id
    experience = await ExperienceRepository.create(session, experience_dict)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})
    
    return ExperienceResponse.model_validate(experience)


@router.get("/{profile_id}/experiences", response_model=List[ExperienceResponse])
async def get_experiences(
    profile_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Récupère toutes les expériences d'un profil"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id and "ROLE_ADMIN" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    experiences = await ExperienceRepository.get_by_profile_id(session, profile_id)
    return [ExperienceResponse.model_validate(exp) for exp in experiences]


@router.delete("/{profile_id}/experiences/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    profile_id: int,
    experience_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Supprime une expérience"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    experience = await ExperienceRepository.get_by_id(session, experience_id)
    if not experience or experience.profile_id != profile_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    await ExperienceRepository.delete(session, experience_id)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})


# ============================================
# Education Endpoints
# ============================================

@router.post("/{profile_id}/educations", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
async def create_education(
    profile_id: int,
    education_data: EducationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Crée une formation pour un profil"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    education_dict = education_data.model_dump()
    education_dict["profile_id"] = profile_id
    education = await EducationRepository.create(session, education_dict)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})
    
    return EducationResponse.model_validate(education)


@router.get("/{profile_id}/educations", response_model=List[EducationResponse])
async def get_educations(
    profile_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Récupère toutes les formations d'un profil"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id and "ROLE_ADMIN" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    educations = await EducationRepository.get_by_profile_id(session, profile_id)
    return [EducationResponse.model_validate(edu) for edu in educations]


@router.delete("/{profile_id}/educations/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_education(
    profile_id: int,
    education_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Supprime une formation"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await EducationRepository.delete(session, education_id)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})


# ============================================
# Certification Endpoints
# ============================================

@router.post("/{profile_id}/certifications", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
async def create_certification(
    profile_id: int,
    certification_data: CertificationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Crée une certification pour un profil"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    certification_dict = certification_data.model_dump()
    certification_dict["profile_id"] = profile_id
    certification = await CertificationRepository.create(session, certification_dict)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})
    
    return CertificationResponse.model_validate(certification)


@router.get("/{profile_id}/certifications", response_model=List[CertificationResponse])
async def get_certifications(
    profile_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Récupère toutes les certifications d'un profil"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id and "ROLE_ADMIN" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    certifications = await CertificationRepository.get_by_profile_id(session, profile_id)
    return [CertificationResponse.model_validate(cert) for cert in certifications]


@router.delete("/{profile_id}/certifications/{certification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_certification(
    profile_id: int,
    certification_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Supprime une certification"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await CertificationRepository.delete(session, certification_id)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})


# ============================================
# Skill Endpoints
# ============================================

@router.post("/{profile_id}/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(
    profile_id: int,
    skill_data: SkillCreate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Crée une compétence pour un profil"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    skill_dict = skill_data.model_dump()
    skill_dict["profile_id"] = profile_id
    skill = await SkillRepository.create(session, skill_dict)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})
    
    return SkillResponse.model_validate(skill)


@router.get("/{profile_id}/skills", response_model=List[SkillResponse])
async def get_skills(
    profile_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Récupère toutes les compétences d'un profil"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id and "ROLE_ADMIN" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    skills = await SkillRepository.get_by_profile_id(session, profile_id)
    return [SkillResponse.model_validate(skill) for skill in skills]


@router.delete("/{profile_id}/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    profile_id: int,
    skill_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Supprime une compétence"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await SkillRepository.delete(session, skill_id)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})


# ============================================
# JobPreference Endpoints
# ============================================

@router.put("/{profile_id}/job-preferences", response_model=JobPreferenceResponse)
async def update_job_preferences(
    profile_id: int,
    preference_data: JobPreferenceCreate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Crée ou met à jour les préférences d'emploi d'un profil"""
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    preference_dict = preference_data.model_dump()
    preference = await JobPreferenceRepository.create_or_update(
        session,
        profile_id,
        preference_dict
    )
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})
    
    return JobPreferenceResponse.model_validate(preference)


@router.get("/{profile_id}/job-preferences", response_model=JobPreferenceResponse)
async def get_job_preferences(
    profile_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Récupère les préférences d'emploi d'un profil"""
    from app.infrastructure.repositories import JobPreferenceRepository
    from sqlalchemy import select
    from app.domain.models import JobPreference
    
    profile = await ProfileRepository.get_by_id(session, profile_id)
    if not profile:
        raise ProfileNotFoundError(str(profile_id))
    
    if profile.user_id != current_user.user_id and "ROLE_ADMIN" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    result = await session.execute(
        select(JobPreference).where(JobPreference.profile_id == profile_id)
    )
    preference = result.scalar_one_or_none()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job preferences not found"
        )
    
    return JobPreferenceResponse.model_validate(preference)

