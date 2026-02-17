"""
Repositories pour les opérations de base de données
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlmodel import SQLModel

from app.domain.models import (
    Profile, Experience, Education, Certification, Skill, JobPreference, ProfileStatus,
    JobOffer, Application, JobStatus,
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


class JobOfferRepository:
    """Repository pour les offres d'emploi"""

    @staticmethod
    async def create(session: AsyncSession, data: dict) -> JobOffer:
        """Crée une offre d'emploi"""
        job = JobOffer(**data)
        session.add(job)
        await session.commit()
        await session.refresh(job)
        return job

    @staticmethod
    async def get_by_id(session: AsyncSession, job_id: int) -> Optional[JobOffer]:
        """Récupère une offre par ID"""
        result = await session.execute(select(JobOffer).where(JobOffer.id == job_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def increment_view_count(session: AsyncSession, job_id: int) -> bool:
        """Incrémente le compteur de vues pour une offre publiée."""
        from sqlalchemy import update
        job = await JobOfferRepository.get_by_id(session, job_id)
        if not job or job.status != JobStatus.PUBLISHED:
            return False
        stmt = update(JobOffer).where(JobOffer.id == job_id).values(
            view_count=JobOffer.view_count + 1
        )
        await session.execute(stmt)
        await session.commit()
        return True

    @staticmethod
    async def increment_register_click_count(session: AsyncSession, job_id: int) -> bool:
        """Incrémente le compteur de clics sur Créer mon compte (depuis modal Postuler)."""
        from sqlalchemy import update
        job = await JobOfferRepository.get_by_id(session, job_id)
        if not job or job.status != JobStatus.PUBLISHED:
            return False
        stmt = update(JobOffer).where(JobOffer.id == job_id).values(
            register_click_count=JobOffer.register_click_count + 1
        )
        await session.execute(stmt)
        await session.commit()
        return True

    @staticmethod
    async def list_published(
        session: AsyncSession,
        title: Optional[str] = None,
        location: Optional[str] = None,
        contract_type: Optional[str] = None,
        company: Optional[str] = None,
        sector: Optional[str] = None,
    ) -> List[JobOffer]:
        """Liste les offres publiées et non expirées, avec filtres optionnels"""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        stmt = select(JobOffer).where(
            JobOffer.status == JobStatus.PUBLISHED,
            # Exclure les offres expirées (expires_at null = pas de limite)
            (JobOffer.expires_at.is_(None)) | (JobOffer.expires_at > now),
        )
        if title:
            stmt = stmt.where(JobOffer.title.ilike(f"%{title}%"))
        if location:
            stmt = stmt.where(JobOffer.location.ilike(f"%{location}%"))
        if contract_type:
            stmt = stmt.where(JobOffer.contract_type == contract_type)
        if company:
            stmt = stmt.where(JobOffer.company_name.ilike(f"%{company}%"))
        if sector:
            stmt = stmt.where(JobOffer.sector.ilike(f"%{sector}%"))
        stmt = stmt.order_by(JobOffer.created_at.desc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def list_all(session: AsyncSession) -> List[JobOffer]:
        """Liste toutes les offres (admin)"""
        result = await session.execute(
            select(JobOffer).order_by(JobOffer.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_stats(session: AsyncSession) -> dict:
        """Statistiques des offres par statut + total candidatures + métriques acquisition + pipeline."""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        # Comptage par statut
        stmt = select(JobOffer.status, func.count(JobOffer.id).label("count")).group_by(JobOffer.status)
        result = await session.execute(stmt)
        rows = result.all()
        by_status = {"DRAFT": 0, "PUBLISHED": 0, "CLOSED": 0, "ARCHIVED": 0}
        for row in rows:
            status_val = row.status.value if hasattr(row.status, "value") else str(row.status)
            if status_val in by_status:
                by_status[status_val] = row.count
        # Offres PUBLISHED expirées (expires_at <= now)
        stmt_expired = select(func.count(JobOffer.id)).where(
            JobOffer.status == JobStatus.PUBLISHED,
            JobOffer.expires_at.isnot(None),
            JobOffer.expires_at <= now,
        )
        expired_result = await session.execute(stmt_expired)
        expired_count = expired_result.scalar() or 0
        # Total candidatures
        stmt_apps = select(func.count(Application.id)).select_from(Application)
        apps_result = await session.execute(stmt_apps)
        applications_count = apps_result.scalar() or 0
        # Métriques acquisition (vues, clics)
        stmt_views = select(func.coalesce(func.sum(JobOffer.view_count), 0)).select_from(JobOffer)
        stmt_clicks = select(func.coalesce(func.sum(JobOffer.register_click_count), 0)).select_from(JobOffer)
        views_result = await session.execute(stmt_views)
        clicks_result = await session.execute(stmt_clicks)
        total_view_count = int(views_result.scalar() or 0)
        total_register_click_count = int(clicks_result.scalar() or 0)
        # Pipeline candidatures par statut
        stmt_pipeline = select(Application.status, func.count(Application.id).label("count")).group_by(Application.status)
        pipeline_result = await session.execute(stmt_pipeline)
        pipeline_rows = pipeline_result.all()
        applications_by_status = {}
        for row in pipeline_rows:
            status_val = str(row.status) if row.status else "PENDING"
            applications_by_status[status_val] = row.count
        # Top offres par nombre de candidatures
        stmt_top = (
            select(JobOffer.id, JobOffer.title, JobOffer.company_name, func.count(Application.id).label("app_count"))
            .outerjoin(Application, JobOffer.id == Application.job_offer_id)
            .group_by(JobOffer.id, JobOffer.title, JobOffer.company_name)
            .order_by(func.count(Application.id).desc())
        )
        top_result = await session.execute(stmt_top)
        top_jobs = [
            {"job_id": r.id, "title": r.title, "company_name": r.company_name or "", "applications": r.app_count}
            for r in top_result.all()[:10]
        ]
        # Moyenne candidatures par offre publiée
        published_count = by_status.get("PUBLISHED", 0)
        avg_applications = round(applications_count / published_count, 1) if published_count > 0 else 0
        return {
            "total": sum(by_status.values()),
            "by_status": by_status,
            "expired_published": expired_count,
            "applications": applications_count,
            "total_view_count": total_view_count,
            "total_register_click_count": total_register_click_count,
            "applications_by_status": applications_by_status,
            "top_jobs_by_applications": top_jobs,
            "avg_applications_per_job": avg_applications,
        }

    @staticmethod
    async def archive_expired(session: AsyncSession) -> int:
        """Archive les offres PUBLISHED dont expires_at est dépassé. Retourne le nombre archivé."""
        from sqlalchemy import update
        # Utiliser UTC naive pour compatibilité avec les colonnes DateTime sans timezone
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        stmt = (
            update(JobOffer)
            .where(
                JobOffer.status == JobStatus.PUBLISHED,
                JobOffer.expires_at.isnot(None),
                JobOffer.expires_at <= now,
            )
            .values(status=JobStatus.ARCHIVED)
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount

    @staticmethod
    async def update(session: AsyncSession, job_id: int, data: dict) -> Optional[JobOffer]:
        """Met à jour une offre"""
        job = await JobOfferRepository.get_by_id(session, job_id)
        if not job:
            return None
        for key, value in data.items():
            if hasattr(job, key):
                setattr(job, key, value)
        await session.commit()
        await session.refresh(job)
        return job


class ApplicationRepository:
    """Repository pour les candidatures"""

    @staticmethod
    async def create(
        session: AsyncSession,
        candidate_id: int,
        job_offer_id: int,
        cover_letter: Optional[str] = None,
        status: str = "PENDING",
    ) -> Application:
        """Crée une candidature (status: PENDING, EXTERNAL_REDIRECT, etc.)"""
        app = Application(candidate_id=candidate_id, job_offer_id=job_offer_id, cover_letter=cover_letter, status=status)
        session.add(app)
        await session.commit()
        await session.refresh(app)
        return app

    @staticmethod
    async def exists(session: AsyncSession, candidate_id: int, job_offer_id: int) -> bool:
        """Vérifie si le candidat a déjà postulé à cette offre"""
        result = await session.execute(
            select(Application).where(
                and_(
                    Application.candidate_id == candidate_id,
                    Application.job_offer_id == job_offer_id,
                )
            )
        )
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def list_job_ids_by_candidate(session: AsyncSession, candidate_id: int) -> List[int]:
        """Liste les IDs des offres auxquelles le candidat a postulé."""
        result = await session.execute(
            select(Application.job_offer_id).where(Application.candidate_id == candidate_id).distinct()
        )
        return [row[0] for row in result.all()]

    @staticmethod
    async def list_applications_by_candidate(
        session: AsyncSession, candidate_id: int
    ) -> List[tuple]:
        """Liste les candidatures du candidat : [(job_offer_id, status, rejection_reason), ...] (une par offre)."""
        result = await session.execute(
            select(Application.job_offer_id, Application.status, Application.rejection_reason)
            .where(Application.candidate_id == candidate_id)
            .order_by(Application.applied_at.desc())
        )
        rows = result.all()
        seen = set()
        out = []
        for row in rows:
            job_id, status, rejection_reason = row[0], row[1], row[2] if len(row) > 2 else None
            if job_id not in seen:
                seen.add(job_id)
                out.append((job_id, status or "PENDING", rejection_reason))
        return out

    @staticmethod
    async def list_by_job(session: AsyncSession, job_offer_id: int) -> List[tuple]:
        """Liste les candidatures pour une offre avec profil. Retourne [(Application, Profile|None), ...]"""
        result = await session.execute(
            select(Application)
            .where(Application.job_offer_id == job_offer_id)
            .order_by(Application.applied_at.desc())
        )
        apps = list(result.scalars().all())
        if not apps:
            return []
        from app.domain.models import Profile
        profile_ids = [a.candidate_id for a in apps]
        profiles_result = await session.execute(
            select(Profile).where(Profile.id.in_(profile_ids))
        )
        profiles = {p.id: p for p in profiles_result.scalars().all()}
        return [(a, profiles.get(a.candidate_id)) for a in apps]

    @staticmethod
    async def update_status(
        session: AsyncSession,
        application_id: int,
        job_offer_id: int,
        new_status: str,
        rejection_reason: Optional[str] = None,
    ) -> Optional[Application]:
        """Met à jour le statut d'une candidature (admin). Vérifie que l'application appartient à l'offre."""
        result = await session.execute(
            select(Application).where(
                and_(
                    Application.id == application_id,
                    Application.job_offer_id == job_offer_id,
                )
            )
        )
        app = result.scalar_one_or_none()
        if not app:
            return None
        app.status = new_status
        if new_status == "REJECTED" and rejection_reason is not None:
            app.rejection_reason = rejection_reason.strip() or None
        elif new_status != "REJECTED":
            app.rejection_reason = None
        session.add(app)
        await session.commit()
        await session.refresh(app)
        return app
