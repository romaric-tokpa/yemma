"""
Endpoints API pour la gestion des profils candidats
"""
from typing import List, Optional
from datetime import datetime
import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status as http_status
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, require_current_user, TokenData
from app.infrastructure.internal_auth import verify_internal_token
from app.infrastructure.repositories import (
    ProfileRepository, ExperienceRepository, EducationRepository,
    CertificationRepository, SkillRepository, JobPreferenceRepository
)
from app.domain.models import ProfileStatus
from app.domain.schemas import (
    ProfileResponse, ProfileDetailResponse, PaginatedProfilesResponse,
    ProfileCreate, ProfileUpdate,
    ExperienceCreate, ExperienceResponse,
    EducationCreate, EducationResponse,
    CertificationCreate, CertificationResponse,
    SkillCreate, SkillResponse,
    JobPreferenceCreate, JobPreferenceResponse,
    ProfileSubmitRequest
)
from app.domain.onboarding_schemas import PartialProfileUpdateSchema
from pydantic import ValidationError
from app.core.exceptions import (
    ProfileNotFoundError, ProfileAlreadyExistsError,
    InvalidProfileStatusError, ProfileNotCompleteError
)
from app.core.completion import can_submit_profile

router = APIRouter(prefix="/profiles", tags=["profiles"])
logger = logging.getLogger(__name__)


# ============================================
# Profile Endpoints
# ============================================

@router.post("", response_model=ProfileResponse, status_code=http_status.HTTP_201_CREATED)
async def create_profile(
    profile_data: ProfileCreate,
    session: AsyncSession = Depends(get_session),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    Crée un nouveau profil candidat ou retourne le profil existant.

    En mode développement, si un profil existe déjà pour l'utilisateur,
    le profil existant est retourné au lieu de lever une erreur.
    """
    # Vérifier que current_user existe
    current_user = require_current_user(current_user)

    # Vérifier qu'un profil n'existe pas déjà pour cet utilisateur
    existing = await ProfileRepository.get_by_user_id(session, current_user.user_id)
    if existing:
        # Retourner le profil existant au lieu de lever une erreur
        # Cela facilite le développement et évite les erreurs de doublon
        logger.info(f"Profile already exists for user {current_user.user_id}, returning existing profile")
        return ProfileResponse.model_validate(existing)

    # Créer le profil (gérer la race : un autre request peut avoir créé entre le get et l'insert)
    profile_dict = profile_data.model_dump()
    profile_dict["user_id"] = current_user.user_id
    try:
        profile = await ProfileRepository.create(session, profile_dict)
    except IntegrityError as e:
        await session.rollback()  # Nécessaire avec AsyncSession
        logger.warning(f"IntegrityError creating profile for user {current_user.user_id}: {str(e)}")
        # Race condition : le profil a été créé entre le get et l'insert
        # Récupérer le profil existant et le retourner
        existing = await ProfileRepository.get_by_user_id(session, current_user.user_id)
        if existing:
            return ProfileResponse.model_validate(existing)
        # Si le profil n'existe toujours pas, lever une erreur générique
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create profile: {str(e)}"
        )

    return ProfileResponse.model_validate(profile)


@router.post("/from-cv", status_code=http_status.HTTP_201_CREATED)
async def create_profile_from_cv(
    file: UploadFile = File(..., description="Fichier CV (PDF ou DOCX)"),
    session: AsyncSession = Depends(get_session),
    current_user: Optional[TokenData] = Depends(get_current_user),
):
    """
    Crée un profil candidat à partir d'un CV en utilisant le parsing Hrflow.ai.
    Le candidat upload son CV : le profil est extrait et créé automatiquement.
    """
    current_user = require_current_user(current_user)
    logger.info("POST /from-cv: création de profil depuis CV (user_id=%s, filename=%s)", current_user.user_id, getattr(file, "filename", None))

    existing = await ProfileRepository.get_by_user_id(session, current_user.user_id)
    if existing:
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail="Un profil existe déjà pour ce compte. Utilisez la modification de profil.",
        )

    if not file.filename or not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Format de fichier non supporté. Utilisez un PDF ou DOCX.",
        )

    file_content = await file.read()
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Le fichier ne doit pas dépasser 10 Mo.",
        )

    hrflow_profile = None
    try:
        from app.infrastructure.hrflow_client import parse_resume_file
        hrflow_profile = await parse_resume_file(file_content, file.filename or "cv.pdf")
        if hrflow_profile:
            logger.info("Hrflow parsing successful, extracted profile data: %s", {
                "has_info": "info" in hrflow_profile or "Information" in hrflow_profile,
                "has_experiences": bool(hrflow_profile.get("experiences") or hrflow_profile.get("experience")),
                "has_educations": bool(hrflow_profile.get("education") or hrflow_profile.get("educations")),
                "has_skills": bool(hrflow_profile.get("skills") or hrflow_profile.get("skill")),
            })
    except Exception as e:
        logger.warning("Hrflow parsing failed, creating minimal profile: %s", e)

    email = getattr(current_user, "email", None) or ""
    if not hrflow_profile:
        logger.info("Création d'un profil minimal (pas de données Hrflow)")

    if hrflow_profile:
        from app.utils.hrflow_mapper import (
            map_hrflow_to_profile_create,
            map_hrflow_to_step1_update,
            map_hrflow_experiences,
            map_hrflow_educations,
            map_hrflow_skills,
        )
        profile_data = map_hrflow_to_profile_create(hrflow_profile, email)
        step1 = map_hrflow_to_step1_update(hrflow_profile, email)
    else:
        profile_data = ProfileCreate(email=email, first_name=None, last_name=None)
        step1 = {}

    profile_dict = profile_data.model_dump()
    profile_dict["user_id"] = current_user.user_id
    profile = await ProfileRepository.create(session, profile_dict)

    if hrflow_profile:
        # Appliquer toutes les données step1 au profil créé
        update_dict = {}
        for key, value in step1.items():
            if value is not None and hasattr(profile, key):
                update_dict[key] = value
        
        if update_dict:
            logger.info("Updating profile with parsed data: %s", list(update_dict.keys()))
            # Utiliser ProfileRepository.update pour mettre à jour proprement
            await ProfileRepository.update(session, profile.id, update_dict)
            await session.refresh(profile)
        # Clé HrFlow pour Profile Asking (CvGPT)
        hrflow_key = hrflow_profile.get("key")
        if hrflow_key:
            await ProfileRepository.update(session, profile.id, {"hrflow_profile_key": hrflow_key})
            await session.refresh(profile)
        
        # Créer les expériences
        exp_list = map_hrflow_experiences(hrflow_profile)
        logger.info("Creating %d experiences from parsed CV", len(exp_list))
        for exp in exp_list:
            exp["profile_id"] = profile.id
            try:
                await ExperienceRepository.create(session, exp)
            except Exception as ex:
                logger.warning("Skip experience create: %s", ex)
        
        # Créer les formations
        edu_list = map_hrflow_educations(hrflow_profile)
        logger.info("Creating %d educations from parsed CV", len(edu_list))
        for edu in edu_list:
            edu["profile_id"] = profile.id
            try:
                await EducationRepository.create(session, edu)
            except Exception as ex:
                logger.warning("Skip education create: %s", ex)
        
        # Créer les compétences
        skill_list = map_hrflow_skills(hrflow_profile)
        logger.info("Creating %d skills from parsed CV", len(skill_list))
        for sk in skill_list:
            sk["profile_id"] = profile.id
            try:
                await SkillRepository.create(session, sk)
            except Exception as ex:
                logger.warning("Skip skill create: %s", ex)


    profile = await ProfileRepository.get_by_user_id_with_relations(session, current_user.user_id)
    if not profile:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Profil non trouvé après création")

    response_data = ProfileResponse.model_validate(profile).model_dump()
    response_data["experiences"] = [ExperienceResponse.model_validate(e).model_dump() for e in profile.experiences]
    response_data["educations"] = [EducationResponse.model_validate(e).model_dump() for e in profile.educations]
    response_data["certifications"] = [CertificationResponse.model_validate(c).model_dump() for c in profile.certifications]
    response_data["skills"] = [SkillResponse.model_validate(s).model_dump() for s in profile.skills]
    if profile.job_preferences:
        try:
            response_data["job_preferences"] = JobPreferenceResponse.model_validate(profile.job_preferences).model_dump()
        except Exception:
            response_data["job_preferences"] = None
    else:
        response_data["job_preferences"] = None
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
        "last_step_completed": profile.last_step_completed,
        "accept_cgu": profile.accept_cgu,
        "accept_rgpd": profile.accept_rgpd,
        "accept_verification": profile.accept_verification,
    })
    return response_data


def _debug_log(location: str, message: str, data: dict, hypothesis_id: str):
    import json
    import time
    payload = {"location": location, "message": message, "data": data, "hypothesisId": hypothesis_id, "timestamp": int(time.time() * 1000)}
    # Envoyer via HTTP (accessible depuis Docker via host.docker.internal)
    for url in ["http://host.docker.internal:7243/ingest/1bce2d70-be0c-458b-b590-abb89d1d3933", "http://127.0.0.1:7243/ingest/1bce2d70-be0c-458b-b590-abb89d1d3933"]:
        try:
            import urllib.request
            req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
            urllib.request.urlopen(req, timeout=1)
            return
        except Exception:
            continue
    try:
        import os
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        for log_path in [os.path.join(base, ".cursor", "debug.log"), "/tmp/yemma_debug.log"]:
            try:
                with open(log_path, "a") as f:
                    f.write(json.dumps(payload) + "\n")
                return
            except (OSError, IOError):
                continue
    except Exception:
        pass

@router.get("/me")
async def get_my_profile(
    session: AsyncSession = Depends(get_session),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """Récupère le profil de l'utilisateur connecté"""
    # #region agent log
    _debug_log("profiles.py:get_my_profile:entry", "GET /me called", {"current_user_is_none": current_user is None}, "H4")
    # #endregion
    # Vérifier que current_user existe
    current_user = require_current_user(current_user)
    # #region agent log
    _debug_log("profiles.py:get_my_profile:after_auth", "Auth OK", {"user_id": current_user.user_id}, "H4")
    # #endregion
    try:
        # Charger directement le profil avec toutes ses relations en une seule requête
        profile = await ProfileRepository.get_by_user_id_with_relations(session, current_user.user_id)
        # #region agent log
        _debug_log("profiles.py:get_my_profile:profile_fetched", "Profile fetch result", {"has_profile": profile is not None, "user_id": current_user.user_id}, "H2")
        # #endregion
        if not profile:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Profil non trouvé. Complétez l'onboarding pour créer votre profil."
            )
        
        # Construire la réponse avec les relations (mode='json' pour sérialisation datetime correcte)
        response_data = ProfileResponse.model_validate(profile).model_dump(mode="json")
        
        # Ajouter les relations
        response_data["experiences"] = [
            ExperienceResponse.model_validate(exp).model_dump(mode="json") for exp in profile.experiences
        ]
        response_data["educations"] = [
            EducationResponse.model_validate(edu).model_dump(mode="json") for edu in profile.educations
        ]
        response_data["certifications"] = [
            CertificationResponse.model_validate(cert).model_dump(mode="json") for cert in profile.certifications
        ]
        response_data["skills"] = [
            SkillResponse.model_validate(skill).model_dump(mode="json") for skill in profile.skills
        ]
        if profile.job_preferences:
            try:
                job_pref_dict = JobPreferenceResponse.model_validate(profile.job_preferences).model_dump(mode="json")
                response_data["job_preferences"] = job_pref_dict
            except Exception as job_pref_error:
                logger.error(f"Error validating job_preferences for profile {profile.id}: {str(job_pref_error)}", exc_info=True)
                # Si la validation échoue (colonnes manquantes, etc.), essayer de construire manuellement
                ct = profile.job_preferences.contract_type
                response_data["job_preferences"] = {
                    "desired_positions": profile.job_preferences.desired_positions or [],
                    "contract_type": ct.value if hasattr(ct, "value") else ct,
                    "target_sectors": profile.job_preferences.target_sectors or [],
                    "desired_location": profile.job_preferences.desired_location,
                    "mobility": profile.job_preferences.mobility,
                    "availability": profile.job_preferences.availability,
                    "salary_expectations": getattr(profile.job_preferences, 'salary_expectations', None),
                    "salary_min": getattr(profile.job_preferences, 'salary_min', None),
                    "salary_max": getattr(profile.job_preferences, 'salary_max', None),
                }
        
        # Ajouter les champs supplémentaires (dont photo_url et tracking des dates)
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
            "photo_url": profile.photo_url,
            "admin_report": profile.admin_report,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
            "submitted_at": profile.submitted_at.isoformat() if profile.submitted_at else None,
            "validated_at": profile.validated_at.isoformat() if profile.validated_at else None,
            "rejected_at": profile.rejected_at.isoformat() if profile.rejected_at else None,
            "last_step_completed": profile.last_step_completed,
            "accept_cgu": profile.accept_cgu,
            "accept_rgpd": profile.accept_rgpd,
            "accept_verification": profile.accept_verification,
        })
        
        return response_data
    except HTTPException:
        raise
    except ValidationError as e:
        logger.error(f"Validation error in get_my_profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erreur de validation des données: {str(e)}"
        )
    except Exception as e:
        # #region agent log
        _debug_log("profiles.py:get_my_profile:exception", "Exception in get_my_profile", {"error_type": type(e).__name__, "error_msg": str(e)}, "H2")
        # #endregion
        logger.exception(f"Error in get_my_profile for user {current_user.user_id}: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/me/notify-profile-created", status_code=http_status.HTTP_202_ACCEPTED)
async def notify_profile_created(
    session: AsyncSession = Depends(get_session),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    Déclenche l'envoi de l'email de confirmation de création de profil.
    Appelé par le frontend après complétion de l'onboarding (parsing CV).
    """
    current_user = require_current_user(current_user)
    profile = await ProfileRepository.get_by_user_id_with_relations(session, current_user.user_id)
    if not profile:
        raise ProfileNotFoundError(str(current_user.user_id))
    try:
        from app.infrastructure.notification_client import send_candidate_profile_created_notification
        from app.core.config import settings
        candidate_name = f"{profile.first_name or ''} {profile.last_name or ''}".strip()
        if not candidate_name:
            candidate_name = (profile.email or current_user.email or "").split("@")[0] or "Candidat"
        await send_candidate_profile_created_notification(
            candidate_email=profile.email or current_user.email,
            candidate_name=candidate_name,
            dashboard_url=f"{settings.FRONTEND_URL}/candidate/dashboard"
        )
        return {"message": "Profil créé – notification envoyée"}
    except Exception as e:
        logger.warning(f"Failed to send profile created email: {str(e)}")
        return {"message": "Profil créé – notification en attente"}


@router.get("", response_model=PaginatedProfilesResponse)
async def list_profiles(
    status: Optional[str] = None,
    page: int = 1,
    size: int = 20,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Liste les profils (réservé aux administrateurs).
    Retourne une réponse paginée (items + total) pour afficher la pagination côté admin.
    """
    # 401 si pas de token ou token invalide
    if not current_user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise"
        )
    
    # Rôles : accepter list ou str (cas où le payload est mal formé)
    roles = current_user.roles if isinstance(current_user.roles, list) else []
    if not roles and isinstance(current_user.roles, str):
        roles = [current_user.roles]
    
    # 403 si l'utilisateur n'a pas le rôle admin
    if "ROLE_ADMIN" not in roles and "ROLE_SUPER_ADMIN" not in roles:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Réservé aux administrateurs"
        )
    
    from sqlalchemy import select, func
    from app.domain.models import Profile
    
    base_filter = Profile.deleted_at.is_(None)
    if status:
        try:
            status_enum = ProfileStatus(status.upper())
            base_filter = base_filter & (Profile.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Statut invalide : {status}. Valeurs : DRAFT, SUBMITTED, IN_REVIEW, VALIDATED, REJECTED, ARCHIVED"
            )
    
    # Total pour la pagination
    count_q = select(func.count()).select_from(Profile).where(base_filter)
    total_result = await session.execute(count_q)
    total = total_result.scalar() or 0
    
    # Page d'éléments
    offset = (page - 1) * size
    query = select(Profile).where(base_filter).order_by(
        Profile.submitted_at.desc().nullsfirst(), Profile.created_at.desc()
    ).offset(offset).limit(size)
    result = await session.execute(query)
    profiles = result.scalars().all()
    
    return PaginatedProfilesResponse(
        items=[ProfileResponse.model_validate(p) for p in profiles],
        total=total
    )


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
    
    # Vérifier que current_user existe
    current_user = require_current_user(current_user)
    
    profile = await ProfileRepository.get_by_user_id(session, current_user.user_id)
    if not profile:
        raise ProfileNotFoundError(str(current_user.user_id))
    
    # Si le profil est VALIDATED, IN_REVIEW ou SUBMITTED, on permet la modification
    # mais on le remet en SUBMITTED pour revalidation (pas DRAFT)
    should_resubmit = profile.status in [
        ProfileStatus.VALIDATED, 
        ProfileStatus.IN_REVIEW, 
        ProfileStatus.SUBMITTED
    ]
    
    # On ne peut pas modifier un profil ARCHIVED
    if profile.status == ProfileStatus.ARCHIVED:
        raise InvalidProfileStatusError(
            profile.status.value,
            "DRAFT, REJECTED, VALIDATED, IN_REVIEW or SUBMITTED"
        )
    
    profile_update_data = {}
    
    # Si le profil était validé/soumis/en review, le remettre en SUBMITTED pour revalidation
    if should_resubmit:
        from datetime import datetime
        was_validated = profile.status == ProfileStatus.VALIDATED
        profile_update_data["status"] = ProfileStatus.SUBMITTED
        profile_update_data["submitted_at"] = datetime.utcnow()
        # Réinitialiser les champs de validation (sera réévalué par l'admin)
        profile_update_data["validated_at"] = None
        profile_update_data["admin_score"] = None
        profile_update_data["admin_report"] = None
        profile_update_data["rejected_at"] = None
        profile_update_data["rejection_reason"] = None
        
        # Si le profil était validé, le supprimer de l'index ElasticSearch
        # car il ne doit plus être visible dans la CVthèque jusqu'à revalidation
        if was_validated:
            try:
                from app.core.config import settings
                from app.infrastructure.internal_auth import get_service_token_header
                import httpx
                
                headers = get_service_token_header("candidate-service")
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.delete(
                        f"{settings.SEARCH_SERVICE_URL}/api/v1/candidates/index/{profile.id}",
                        headers=headers
                    )
                logger.info(f"Profile {profile.id} removed from search index (status changed from VALIDATED to SUBMITTED)")
            except Exception as e:
                # Log l'erreur mais ne bloque pas la mise à jour du profil
                logger.warning(f"Failed to remove profile {profile.id} from search index: {str(e)}")
    
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
        # Ne mettre à jour que si le dictionnaire n'est pas vide
        if step1_dict:
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
            skill_dict["skill_type"] = "TECHNICAL"  # Utiliser la valeur de l'enum en majuscules
            await SkillRepository.create(session, skill_dict)
        
        # Créer les compétences comportementales (soft skills)
        for soft_skill_name in update_data.step5.soft_skills:
            skill_dict = {
                "profile_id": profile.id,
                "skill_type": "SOFT",  # Utiliser la valeur de l'enum en majuscules
                "name": soft_skill_name,
                "level": None,  # Les soft skills n'ont pas de niveau
                "years_of_practice": None  # Les soft skills n'ont pas d'années de pratique
            }
            await SkillRepository.create(session, skill_dict)
        
        # Créer les outils/logiciels
        for tool in update_data.step5.tools:
            skill_dict = tool.model_dump(exclude_unset=True)
            skill_dict["profile_id"] = profile.id
            skill_dict["skill_type"] = "TOOL"  # Utiliser la valeur de l'enum en majuscules
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
    request: Request,
    session: AsyncSession = Depends(get_session),
    service_info: Optional[dict] = Depends(verify_internal_token),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    Récupère un profil par ID
    
    Accepte soit un token utilisateur (Bearer) soit un token de service (X-Service-Token).
    Si un token de service est fourni, les vérifications de permissions utilisateur sont ignorées.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Logger les headers pour débogage
    x_service_token = request.headers.get("X-Service-Token") or request.headers.get("x-service-token")
    x_service_name = request.headers.get("X-Service-Name") or request.headers.get("x-service-name")
    logger.info(f"get_profile called for profile_id={profile_id}, service_info={service_info is not None}, current_user={current_user.user_id if current_user else None}")
    logger.info(f"Headers - X-Service-Token present: {x_service_token is not None}, X-Service-Name: {x_service_name}")
    
    try:
        profile = await ProfileRepository.get_with_relations(session, profile_id)
        if not profile:
            raise ProfileNotFoundError(str(profile_id))
        
        # Si c'est un appel inter-service (service_info est présent), autoriser l'accès
        # Sinon, vérifier les permissions utilisateur
        if not service_info:
            logger.info(f"No service_info, checking user permissions for profile_id={profile_id}")
            if not current_user:
                raise HTTPException(
                    status_code=http_status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            # Vérifier que l'utilisateur est le propriétaire du profil ou un administrateur
            is_owner = profile.user_id == current_user.user_id
            # S'assurer que roles est une liste
            user_roles = current_user.roles if isinstance(current_user.roles, list) else []
            is_admin = "ROLE_ADMIN" in user_roles or "ROLE_SUPER_ADMIN" in user_roles
            if not is_owner and not is_admin:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this profile"
                )
        
        # Construire la réponse avec les relations - convertir les objets SQLModel en dictionnaires
        response_data = ProfileResponse.model_validate(profile).model_dump()
        
        # Ajouter les relations en convertissant les objets SQLModel en dictionnaires
        response_data["experiences"] = [ExperienceResponse.model_validate(exp).model_dump() for exp in profile.experiences]
        response_data["educations"] = [EducationResponse.model_validate(edu).model_dump() for edu in profile.educations]
        response_data["certifications"] = [CertificationResponse.model_validate(cert).model_dump() for cert in profile.certifications]
        response_data["skills"] = [SkillResponse.model_validate(skill).model_dump() for skill in profile.skills]
        
        # Traiter job_preferences
        if profile.job_preferences:
            try:
                job_pref_dict = JobPreferenceResponse.model_validate(profile.job_preferences).model_dump()
                response_data["job_preferences"] = job_pref_dict
            except Exception as job_pref_error:
                logger.error(f"Error validating job_preferences for profile {profile.id}: {str(job_pref_error)}", exc_info=True)
                # Si la validation échoue, construire manuellement
                response_data["job_preferences"] = {
                    "id": profile.job_preferences.id,
                    "profile_id": profile.job_preferences.profile_id,
                    "desired_positions": profile.job_preferences.desired_positions or [],
                    "contract_type": profile.job_preferences.contract_type,
                    "target_sectors": profile.job_preferences.target_sectors or [],
                    "desired_location": profile.job_preferences.desired_location,
                    "mobility": profile.job_preferences.mobility,
                    "availability": profile.job_preferences.availability,
                    "salary_min": getattr(profile.job_preferences, 'salary_min', None),
                    "salary_max": getattr(profile.job_preferences, 'salary_max', None),
                    "salary_expectations": getattr(profile.job_preferences, 'salary_expectations', None),
                    "created_at": profile.job_preferences.created_at.isoformat() if profile.job_preferences.created_at else None,
                }
        else:
            response_data["job_preferences"] = None
        
        # Ajouter les champs supplémentaires pour ProfileDetailResponse (tracking des dates en ISO)
        response_data.update({
            "hrflow_profile_key": getattr(profile, "hrflow_profile_key", None),
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
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
            "submitted_at": profile.submitted_at.isoformat() if profile.submitted_at else None,
            "validated_at": profile.validated_at.isoformat() if profile.validated_at else None,
            "rejected_at": profile.rejected_at.isoformat() if profile.rejected_at else None,
            "accept_cgu": profile.accept_cgu,
            "accept_rgpd": profile.accept_rgpd,
            "accept_verification": profile.accept_verification,
        })
        
        return response_data
    except (ProfileNotFoundError, HTTPException):
        raise
    except Exception as e:
        logger.error(f"Error in get_profile for profile_id {profile_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.put("/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: int,
    update_data: ProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: Optional[TokenData] = Depends(get_current_user),
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
        # Vérifier que current_user existe et a un user_id
        if not current_user or not hasattr(current_user, 'user_id'):
            raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        if profile.user_id != current_user.user_id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this profile"
            )
    
    # Vérifier le statut - permettre la mise à jour du statut uniquement pour les services internes
    # Les utilisateurs normaux peuvent modifier les profils en DRAFT, REJECTED, ou VALIDATED/IN_REVIEW/SUBMITTED
    # Si le profil est VALIDATED/IN_REVIEW/SUBMITTED, il sera automatiquement remis en SUBMITTED pour revalidation
    update_dict = update_data.model_dump(exclude_unset=True)
    is_status_update = "status" in update_dict
    is_internal_service = service_info is not None
    
    # Si le profil est VALIDATED, IN_REVIEW ou SUBMITTED et que l'utilisateur modifie le profil,
    # le remettre en SUBMITTED pour revalidation (sauf si c'est un service interne qui met à jour le statut explicitement)
    if not is_internal_service:
        if profile.status == ProfileStatus.ARCHIVED:
            raise InvalidProfileStatusError(
                profile.status.value,
                "DRAFT, REJECTED, VALIDATED, IN_REVIEW or SUBMITTED"
            )
        
        # Si le profil est validé/soumis/en review et qu'on modifie (sans changer le statut explicitement),
        # le remettre en SUBMITTED pour revalidation
        if profile.status in [ProfileStatus.VALIDATED, ProfileStatus.IN_REVIEW, ProfileStatus.SUBMITTED] and not is_status_update:
            from datetime import datetime
            was_validated = profile.status == ProfileStatus.VALIDATED
            update_dict["status"] = ProfileStatus.SUBMITTED.value
            update_dict["submitted_at"] = datetime.utcnow().isoformat()
            # Réinitialiser les champs de validation
            update_dict["validated_at"] = None
            update_dict["admin_score"] = None
            update_dict["admin_report"] = None
            update_dict["rejected_at"] = None
            update_dict["rejection_reason"] = None
            
            # Si le profil était validé, le supprimer de l'index ElasticSearch
            # car il ne doit plus être visible dans la CVthèque jusqu'à revalidation
            if was_validated:
                try:
                    from app.core.config import settings
                    from app.infrastructure.internal_auth import get_service_token_header
                    import httpx
                    
                    headers = get_service_token_header("candidate-service")
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        await client.delete(
                            f"{settings.SEARCH_SERVICE_URL}/api/v1/candidates/index/{profile_id}",
                            headers=headers
                        )
                    logger.info(f"Profile {profile_id} removed from search index (status changed from VALIDATED to SUBMITTED)")
                except Exception as e:
                    # Log l'erreur mais ne bloque pas la mise à jour du profil
                    logger.warning(f"Failed to remove profile {profile_id} from search index: {str(e)}")
    # Pour les services internes, permettre la mise à jour du statut et fixer les dates de validation/rejet
    if is_internal_service:
        from datetime import datetime
        now = datetime.utcnow()
        new_status = update_dict.get("status")
        if new_status == ProfileStatus.VALIDATED or (isinstance(new_status, str) and new_status == "VALIDATED"):
            update_dict.setdefault("validated_at", now)
            update_dict["rejected_at"] = None
            update_dict["rejection_reason"] = None
        elif new_status == ProfileStatus.REJECTED or (isinstance(new_status, str) and new_status == "REJECTED"):
            update_dict.setdefault("rejected_at", now)
            update_dict["validated_at"] = None
    
    updated_profile = await ProfileRepository.update(
        session,
        profile_id,
        update_dict
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
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit this profile"
        )
    
    try:
        submitted_profile = await ProfileRepository.submit_for_validation(
            session,
            profile_id
        )
        if not submitted_profile:
            raise ProfileNotFoundError(str(profile_id))
        
        # Envoyer l'email de bienvenue après soumission réussie
        try:
            from app.infrastructure.notification_client import send_candidate_welcome_notification
            from app.core.config import settings
            
            # Construire le nom du candidat
            candidate_name = f"{profile.first_name or ''} {profile.last_name or ''}".strip()
            if not candidate_name:
                candidate_name = current_user.email.split('@')[0]  # Fallback sur le nom d'utilisateur
            
            # Envoyer l'email de bienvenue (ne bloque pas si ça échoue)
            await send_candidate_welcome_notification(
                candidate_email=profile.email or current_user.email,
                candidate_name=candidate_name,
                dashboard_url=f"{settings.FRONTEND_URL}/candidate/dashboard"
            )
        except Exception as email_error:
            # Logger l'erreur mais ne pas bloquer la soumission
            logger.warning(f"Failed to send welcome email to candidate {profile.email}: {str(email_error)}")
        
        return ProfileResponse.model_validate(submitted_profile)
    except ValueError as e:
        raise ProfileNotCompleteError(str(e))


# ============================================
# Experience Endpoints
# ============================================

@router.post("/{profile_id}/experiences", response_model=ExperienceResponse, status_code=http_status.HTTP_201_CREATED)
async def create_experience(
    profile_id: int,
    experience_data: ExperienceCreate,
    session: AsyncSession = Depends(get_session),
    current_user: TokenData = Depends(get_current_user)
):
    """Crée une expérience pour un profil"""
    try:
        profile = await ProfileRepository.get_by_id(session, profile_id)
        if not profile:
            raise ProfileNotFoundError(str(profile_id))
        
        if profile.user_id != current_user.user_id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Convertir les données en dict et ajouter profile_id
        experience_dict = experience_data.model_dump(exclude_unset=True)
        experience_dict["profile_id"] = profile_id
        
        # Convertir les dates timezone-aware en timezone-naive si nécessaire
        # (pour éviter l'erreur "can't subtract offset-naive and offset-aware datetimes")
        from datetime import timezone
        if "start_date" in experience_dict and experience_dict["start_date"]:
            start_dt = experience_dict["start_date"]
            if hasattr(start_dt, 'tzinfo') and start_dt.tzinfo is not None:
                # Convertir en UTC puis retirer timezone info (timezone-naive)
                experience_dict["start_date"] = start_dt.astimezone(timezone.utc).replace(tzinfo=None)
        
        # Gérer end_date : si is_current est True, end_date doit être None et ne pas être inclus
        is_current = experience_dict.get("is_current", False)
        if is_current:
            # Si l'expérience est en cours, supprimer end_date de l'objet (ne pas l'inclure)
            experience_dict.pop("end_date", None)
        elif "end_date" in experience_dict and experience_dict["end_date"]:
            end_dt = experience_dict["end_date"]
            if hasattr(end_dt, 'tzinfo') and end_dt.tzinfo is not None:
                # Convertir en UTC puis retirer timezone info (timezone-naive)
                experience_dict["end_date"] = end_dt.astimezone(timezone.utc).replace(tzinfo=None)
        # Si end_date n'est pas fourni et is_current est False, laisser None (sera validé par completion.py lors de la soumission)
        
        # Créer l'expérience
        experience = await ExperienceRepository.create(session, experience_dict)
        
        # Recalculer le pourcentage de complétion
        await ProfileRepository.update(session, profile_id, {})
        
        return ExperienceResponse.model_validate(experience)
    except HTTPException:
        # Re-raise les HTTPException (elles ont déjà le bon format)
        raise
    except Exception as e:
        # Logger l'erreur et la retourner avec un message clair
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating experience: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating experience: {str(e)}"
        )


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
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    experiences = await ExperienceRepository.get_by_profile_id(session, profile_id)
    return [ExperienceResponse.model_validate(exp) for exp in experiences]


@router.delete("/{profile_id}/experiences/{experience_id}", status_code=http_status.HTTP_204_NO_CONTENT)
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
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    experience = await ExperienceRepository.get_by_id(session, experience_id)
    if not experience or experience.profile_id != profile_id:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    await ExperienceRepository.delete(session, experience_id)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})


# ============================================
# Education Endpoints
# ============================================

@router.post("/{profile_id}/educations", response_model=EducationResponse, status_code=http_status.HTTP_201_CREATED)
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    educations = await EducationRepository.get_by_profile_id(session, profile_id)
    return [EducationResponse.model_validate(edu) for edu in educations]


@router.delete("/{profile_id}/educations/{education_id}", status_code=http_status.HTTP_204_NO_CONTENT)
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await EducationRepository.delete(session, education_id)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})


# ============================================
# Certification Endpoints
# ============================================

@router.post("/{profile_id}/certifications", response_model=CertificationResponse, status_code=http_status.HTTP_201_CREATED)
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    certifications = await CertificationRepository.get_by_profile_id(session, profile_id)
    return [CertificationResponse.model_validate(cert) for cert in certifications]


@router.delete("/{profile_id}/certifications/{certification_id}", status_code=http_status.HTTP_204_NO_CONTENT)
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    await CertificationRepository.delete(session, certification_id)
    
    # Recalculer le pourcentage de complétion
    await ProfileRepository.update(session, profile_id, {})


# ============================================
# Skill Endpoints
# ============================================

@router.post("/{profile_id}/skills", response_model=SkillResponse, status_code=http_status.HTTP_201_CREATED)
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    skills = await SkillRepository.get_by_profile_id(session, profile_id)
    return [SkillResponse.model_validate(skill) for skill in skills]


@router.delete("/{profile_id}/skills/{skill_id}", status_code=http_status.HTTP_204_NO_CONTENT)
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not authorized")
    
    result = await session.execute(
        select(JobPreference).where(JobPreference.profile_id == profile_id)
    )
    preference = result.scalar_one_or_none()
    
    if not preference:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Job preferences not found"
        )
    
    return JobPreferenceResponse.model_validate(preference)

