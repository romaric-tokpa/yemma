"""
Repositories pour les opérations de base de données
"""
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
        
        for key, value in update_data.items():
            setattr(profile, key, value)
        
        # Recalculer le pourcentage de complétion
        # Recharger le profil avec les relations pour le calcul
        profile_with_relations = await ProfileRepository.get_with_relations(session, profile_id)
        if profile_with_relations:
            from app.core.completion import check_cv_exists
            has_cv = await check_cv_exists(profile_id)
            profile.completion_percentage = calculate_completion_percentage(profile_with_relations, has_cv=has_cv)
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
        profile = await ProfileRepository.get_with_relations(session, profile_id)
        if not profile:
            return None
        
        # Vérifier le statut actuel
        if profile.status != ProfileStatus.DRAFT:
            raise ValueError(f"Cannot submit profile with status {profile.status}")
        
        from datetime import datetime
        from app.core.completion import can_submit_profile, check_cv_exists
        
        # Vérifier la présence du CV via le service Document
        has_cv = await check_cv_exists(profile_id)
        
        can_submit, reason = can_submit_profile(profile, has_cv=has_cv)
        if not can_submit:
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

