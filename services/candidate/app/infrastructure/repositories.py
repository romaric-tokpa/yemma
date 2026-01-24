"""
Repositories pour les opérations de base de données
"""
import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlmodel import SQLModel

from app.domain.models import (
    Profile, Experience, Education, Certification, Skill, JobPreference, ProfileStatus
)
from app.core.exceptions import ProfileNotFoundError, ProfileAlreadyExistsError
from app.core.completion import calculate_completion_percentage

logger = logging.getLogger(__name__)


class ProfileRepository:
    """Repository pour les opérations sur les profils"""
    
    @staticmethod
    async def create(session: AsyncSession, profile_data: dict) -> Profile:
        """Crée un nouveau profil"""
        profile = Profile(**profile_data)
        
        # Calculer le pourcentage de complétion initial
        profile.completion_percentage = 0.0
        
        session.add(profile)
        await session.commit()
        await session.refresh(profile)
        return profile
    
    @staticmethod
    async def get_by_id(session: AsyncSession, profile_id: int) -> Optional[Profile]:
        """Récupère un profil par ID"""
        result = await session.execute(
            select(Profile).where(and_(
                Profile.id == profile_id,
                Profile.deleted_at.is_(None)
            ))
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_by_user_id(session: AsyncSession, user_id: int) -> Optional[Profile]:
        """Récupère un profil par user_id"""
        result = await session.execute(
            select(Profile).where(and_(
                Profile.user_id == user_id,
                Profile.deleted_at.is_(None)
            ))
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_by_user_id_with_relations(session: AsyncSession, user_id: int) -> Optional[Profile]:
        """Récupère un profil par user_id avec toutes ses relations en une seule requête optimisée"""
        result = await session.execute(
            select(Profile)
            .where(and_(
                Profile.user_id == user_id,
                Profile.deleted_at.is_(None)
            ))
            .options(
                selectinload(Profile.experiences),
                selectinload(Profile.educations),
                selectinload(Profile.certifications),
                selectinload(Profile.skills),
                selectinload(Profile.job_preferences)
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_with_relations(
        session: AsyncSession,
        profile_id: int
    ) -> Optional[Profile]:
        """Récupère un profil avec toutes ses relations"""
        result = await session.execute(
            select(Profile)
            .where(and_(Profile.id == profile_id, Profile.deleted_at.is_(None)))
            .options(
                selectinload(Profile.experiences),
                selectinload(Profile.educations),
                selectinload(Profile.certifications),
                selectinload(Profile.skills),
                selectinload(Profile.job_preferences)
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update(
        session: AsyncSession,
        profile_id: int,
        update_data: dict
    ) -> Optional[Profile]:
        """Met à jour un profil"""
        profile = await ProfileRepository.get_by_id(session, profile_id)
        if not profile:
            return None
        
        from datetime import datetime
        
        for key, value in update_data.items():
            # Convertir les chaînes ISO datetime en objets datetime pour les champs de date
            if key in ["validated_at", "rejected_at", "date_of_birth"] and isinstance(value, str):
                try:
                    value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    # Si la conversion échoue, garder la valeur originale
                    pass
            # Gérer le statut comme une chaîne ou un enum
            if key == "status" and value:
                from app.domain.models import ProfileStatus
                # Essayer de convertir en enum si c'est une chaîne
                if isinstance(value, str):
                    try:
                        value = ProfileStatus(value)
                    except ValueError:
                        # Si la conversion échoue, garder la valeur originale
                        pass
            setattr(profile, key, value)
        
        # Recalculer le pourcentage de complétion
        # Recharger le profil avec les relations pour le calcul
        try:
            profile_with_relations = await ProfileRepository.get_with_relations(session, profile_id)
            if profile_with_relations:
                from app.core.completion import check_cv_exists
                # Gérer les erreurs de check_cv_exists (timeout, réseau, etc.)
                has_cv = False
                try:
                    has_cv = await check_cv_exists(profile_id)
                except Exception as cv_error:
                    # Si on ne peut pas vérifier le CV (timeout, réseau, etc.), supposer False
                    # Logger l'erreur mais ne pas bloquer la mise à jour
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Erreur lors de la vérification du CV pour le profil {profile_id}: {str(cv_error)}")
                    has_cv = False
                
                profile.completion_percentage = calculate_completion_percentage(profile_with_relations, has_cv=has_cv)
        except Exception as completion_error:
            # Si le calcul de complétion échoue, logger l'erreur mais ne pas bloquer la mise à jour
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors du calcul du pourcentage de complétion pour le profil {profile_id}: {str(completion_error)}", exc_info=True)
            # Garder le pourcentage de complétion actuel ou 0 si non défini
            if not hasattr(profile, 'completion_percentage') or profile.completion_percentage is None:
                profile.completion_percentage = 0.0
        
        from datetime import datetime
        profile.updated_at = datetime.utcnow()
        
        await session.commit()
        await session.refresh(profile)
        return profile
    
    @staticmethod
    async def submit_for_validation(
        session: AsyncSession,
        profile_id: int
    ) -> Optional[Profile]:
        """Soumet un profil pour validation"""
        # Recharger le profil avec toutes les relations pour avoir les données à jour
        profile = await ProfileRepository.get_with_relations(session, profile_id)
        if not profile:
            return None
        
        # Vérifier le statut actuel
        if profile.status != ProfileStatus.DRAFT:
            raise ValueError(f"Cannot submit profile with status {profile.status}")
        
        from datetime import datetime
        from app.core.completion import can_submit_profile, check_cv_exists, calculate_completion_percentage
        
        # Vérifier la présence du CV via le service Document
        has_cv = await check_cv_exists(profile_id)
        logger.info(f"Soumission du profil {profile_id}: has_cv={has_cv}, expériences={len(profile.experiences) if profile.experiences else 0}, formations={len(profile.educations) if profile.educations else 0}")
        
        # Recalculer explicitement le completion_percentage juste avant la vérification
        # pour s'assurer qu'il est à jour avec toutes les données
        try:
            calculated_completion = calculate_completion_percentage(profile, has_cv=has_cv)
            logger.info(f"Calcul du completion_percentage pour le profil {profile_id}: {calculated_completion}%")
            profile.completion_percentage = calculated_completion
            profile.updated_at = datetime.utcnow()
            await session.commit()
            await session.refresh(profile)
            # Recharger le profil après la mise à jour pour avoir les relations à jour
            profile = await ProfileRepository.get_with_relations(session, profile_id)
            logger.info(f"Profil {profile_id} rechargé: completion_percentage={profile.completion_percentage}%")
        except Exception as e:
            logger.warning(f"Erreur lors du recalcul du completion_percentage: {str(e)}", exc_info=True)
            # Continuer même en cas d'erreur, can_submit_profile recalcule de toute façon
        
        # Vérifier si le profil peut être soumis
        can_submit, reason = can_submit_profile(profile, has_cv=has_cv)
        logger.info(f"Vérification soumission profil {profile_id}: can_submit={can_submit}, reason={reason}")
        if not can_submit:
            # Logger les détails du profil pour le débogage
            logger.warning(f"Profil {profile_id} ne peut pas être soumis. Détails du profil:", {
                "has_cv": has_cv,
                "accept_cgu": profile.accept_cgu,
                "accept_rgpd": profile.accept_rgpd,
                "accept_verification": profile.accept_verification,
                "first_name": bool(profile.first_name),
                "last_name": bool(profile.last_name),
                "email": bool(profile.email),
                "date_of_birth": bool(profile.date_of_birth),
                "nationality": bool(profile.nationality),
                "phone": bool(profile.phone),
                "address": bool(profile.address),
                "city": bool(profile.city),
                "country": bool(profile.country),
                "profile_title": bool(profile.profile_title),
                "professional_summary": bool(profile.professional_summary),
                "professional_summary_length": len(profile.professional_summary) if profile.professional_summary else 0,
                "sector": bool(profile.sector),
                "main_job": bool(profile.main_job),
                "total_experience": profile.total_experience,
                "experiences_count": len(profile.experiences) if profile.experiences else 0,
                "educations_count": len(profile.educations) if profile.educations else 0,
                "skills_count": len(profile.skills) if profile.skills else 0,
                "has_job_preferences": bool(profile.job_preferences),
                "completion_percentage": profile.completion_percentage,
            })
            raise ValueError(reason)
        
        profile.status = ProfileStatus.SUBMITTED
        profile.submitted_at = datetime.utcnow()
        profile.updated_at = datetime.utcnow()
        
        await session.commit()
        await session.refresh(profile)
        return profile
    
    @staticmethod
    async def delete(session: AsyncSession, profile_id: int) -> bool:
        """Soft delete d'un profil"""
        profile = await ProfileRepository.get_by_id(session, profile_id)
        if not profile:
            return False
        
        from datetime import datetime
        profile.deleted_at = datetime.utcnow()
        
        await session.commit()
        return True


class ExperienceRepository:
    """Repository pour les expériences"""
    
    @staticmethod
    async def create(session: AsyncSession, experience_data: dict) -> Experience:
        """Crée une expérience"""
        experience = Experience(**experience_data)
        session.add(experience)
        await session.commit()
        await session.refresh(experience)
        return experience
    
    @staticmethod
    async def get_by_id(session: AsyncSession, experience_id: int) -> Optional[Experience]:
        """Récupère une expérience par ID"""
        result = await session.execute(
            select(Experience).where(Experience.id == experience_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_by_profile_id(session: AsyncSession, profile_id: int) -> List[Experience]:
        """Récupère toutes les expériences d'un profil"""
        result = await session.execute(
            select(Experience).where(Experience.profile_id == profile_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def update(
        session: AsyncSession,
        experience_id: int,
        update_data: dict
    ) -> Optional[Experience]:
        """Met à jour une expérience"""
        experience = await ExperienceRepository.get_by_id(session, experience_id)
        if not experience:
            return None
        
        for key, value in update_data.items():
            setattr(experience, key, value)
        
        from datetime import datetime
        experience.updated_at = datetime.utcnow()
        
        await session.commit()
        await session.refresh(experience)
        return experience
    
    @staticmethod
    async def delete(session: AsyncSession, experience_id: int) -> bool:
        """Supprime une expérience"""
        experience = await ExperienceRepository.get_by_id(session, experience_id)
        if not experience:
            return False
        
        await session.delete(experience)
        await session.commit()
        return True


class EducationRepository:
    """Repository pour les formations"""
    
    @staticmethod
    async def create(session: AsyncSession, education_data: dict) -> Education:
        """Crée une formation"""
        education = Education(**education_data)
        session.add(education)
        await session.commit()
        await session.refresh(education)
        return education
    
    @staticmethod
    async def get_by_profile_id(session: AsyncSession, profile_id: int) -> List[Education]:
        """Récupère toutes les formations d'un profil"""
        result = await session.execute(
            select(Education).where(Education.profile_id == profile_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def delete(session: AsyncSession, education_id: int) -> bool:
        """Supprime une formation"""
        result = await session.execute(
            select(Education).where(Education.id == education_id)
        )
        education = result.scalar_one_or_none()
        if not education:
            return False
        
        await session.delete(education)
        await session.commit()
        return True


class CertificationRepository:
    """Repository pour les certifications"""
    
    @staticmethod
    async def create(session: AsyncSession, certification_data: dict) -> Certification:
        """Crée une certification"""
        certification = Certification(**certification_data)
        session.add(certification)
        await session.commit()
        await session.refresh(certification)
        return certification
    
    @staticmethod
    async def get_by_profile_id(session: AsyncSession, profile_id: int) -> List[Certification]:
        """Récupère toutes les certifications d'un profil"""
        result = await session.execute(
            select(Certification).where(Certification.profile_id == profile_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def delete(session: AsyncSession, certification_id: int) -> bool:
        """Supprime une certification"""
        result = await session.execute(
            select(Certification).where(Certification.id == certification_id)
        )
        certification = result.scalar_one_or_none()
        if not certification:
            return False
        
        await session.delete(certification)
        await session.commit()
        return True


class SkillRepository:
    """Repository pour les compétences"""
    
    @staticmethod
    async def create(session: AsyncSession, skill_data: dict) -> Skill:
        """Crée une compétence"""
        skill = Skill(**skill_data)
        session.add(skill)
        await session.commit()
        await session.refresh(skill)
        return skill
    
    @staticmethod
    async def get_by_profile_id(session: AsyncSession, profile_id: int) -> List[Skill]:
        """Récupère toutes les compétences d'un profil"""
        result = await session.execute(
            select(Skill).where(Skill.profile_id == profile_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def delete(session: AsyncSession, skill_id: int) -> bool:
        """Supprime une compétence"""
        result = await session.execute(
            select(Skill).where(Skill.id == skill_id)
        )
        skill = result.scalar_one_or_none()
        if not skill:
            return False
        
        await session.delete(skill)
        await session.commit()
        return True


class JobPreferenceRepository:
    """Repository pour les préférences d'emploi"""
    
    @staticmethod
    async def create_or_update(
        session: AsyncSession,
        profile_id: int,
        preference_data: dict
    ) -> JobPreference:
        """Crée ou met à jour les préférences d'emploi"""
        result = await session.execute(
            select(JobPreference).where(JobPreference.profile_id == profile_id)
        )
        preference = result.scalar_one_or_none()
        
        if preference:
            for key, value in preference_data.items():
                setattr(preference, key, value)
            from datetime import datetime
            preference.updated_at = datetime.utcnow()
        else:
            preference = JobPreference(profile_id=profile_id, **preference_data)
            session.add(preference)
        
        await session.commit()
        await session.refresh(preference)
        return preference

