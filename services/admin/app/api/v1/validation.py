"""
Endpoints de validation des profils candidats
"""
import logging

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, status, File, UploadFile
from fastapi.exceptions import RequestValidationError
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator, ValidationError

from app.infrastructure.auth import require_admin_role
from app.infrastructure.candidate_client import get_candidate_profile, update_candidate_status, update_candidate_evaluation, update_candidate_hrflow_key, delete_candidate_profile
from app.infrastructure.hrflow_parse_client import parse_cv_and_get_key
from app.infrastructure.hrflow_asking_client import ask_profile, HrFlowAskingError
from app.infrastructure.search_client import index_candidate_in_search, remove_candidate_from_search
from app.infrastructure.notification_client import send_profile_validated_notification
from app.infrastructure.audit_client import log_incident
from app.core.exceptions import CandidateNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


def _compute_weighted_score(ratings: Dict[str, int]) -> float:
    """Calcule le score pondéré 0-100 à partir des ratings (1-5 par critère)."""
    if not ratings:
        return 0.0
    weighted_sum = 0.0
    total_weight = 0.0
    category_weights = {"tech": 30, "exp": 25, "soft": 20, "mot": 15, "pot": 10}
    category_items = {
        "tech": ["tech_1", "tech_2", "tech_3", "tech_4"],
        "exp": ["exp_1", "exp_2", "exp_3"],
        "soft": ["soft_1", "soft_2", "soft_3", "soft_4"],
        "mot": ["mot_1", "mot_2", "mot_3"],
        "pot": ["pot_1", "pot_2"],
    }
    for cat, items in category_items.items():
        rated = [ratings.get(k) for k in items if ratings.get(k) and ratings[k] > 0]
        if rated:
            avg = sum(rated) / len(rated)
            weighted_sum += avg * category_weights[cat]
            total_weight += category_weights[cat]
    return (weighted_sum / total_weight) * 20 if total_weight > 0 else 0.0


def _derive_legacy_scores(ratings: Dict[str, int]) -> Dict[str, Optional[float]]:
    """Dérive les notes legacy (0-5) à partir des ratings de la grille."""
    def avg_keys(*keys):
        vals = [ratings.get(k) for k in keys if ratings.get(k) and ratings[k] > 0]
        return sum(vals) / len(vals) if vals else None
    return {
        "technical_skills_rating": avg_keys("tech_1", "tech_2", "tech_3", "tech_4"),
        "soft_skills_rating": avg_keys("soft_1", "soft_2", "soft_3", "soft_4"),
        "communication_rating": ratings.get("soft_1") if ratings.get("soft_1") else None,
        "motivation_rating": avg_keys("mot_1", "mot_2", "mot_3"),
    }


class ValidationReport(BaseModel):
    """Schéma pour le rapport de validation (legacy + grille d'évaluation)"""
    model_config = ConfigDict(extra="ignore")
    # Format legacy
    overallScore: Optional[float] = Field(None, ge=0, le=5, description="Note globale sur 5")
    technicalSkills: Optional[float] = Field(None, ge=0, le=5, description="Note compétences techniques")
    softSkills: Optional[float] = Field(None, ge=0, le=5, description="Note soft skills")
    communication: Optional[float] = Field(None, ge=0, le=5, description="Note communication")
    motivation: Optional[float] = Field(None, ge=0, le=5, description="Note motivation")
    softSkillsTags: Optional[list[str]] = Field(default=[], description="Tags soft skills")
    interview_notes: Optional[str] = Field(default="", description="Notes d'entretien")
    recommendations: Optional[str] = Field(default="", description="Recommandations")
    summary: Optional[str] = Field(default="", description="Résumé de l'évaluation")
    # Format grille d'évaluation (nouveau)
    ratings: Optional[Dict[str, int]] = Field(default=None, description="Notes par critère (1-5)")
    comments: Optional[Dict[str, str]] = Field(default=None, description="Commentaires par critère")
    globalComment: Optional[str] = Field(default=None, description="Avis global du recruteur")
    decision: Optional[str] = Field(default=None, description="retenu | reserve | non_retenu")

    @field_validator("ratings", mode="before")
    @classmethod
    def coerce_ratings(cls, v):
        """Convertit les valeurs de ratings en int (tolère str depuis JSON)."""
        if v is None:
            return None
        if not isinstance(v, dict):
            return v
        return {k: int(val) if val is not None else 0 for k, val in v.items()}

    @field_validator("comments", mode="before")
    @classmethod
    def coerce_comments(cls, v):
        """Convertit les valeurs de comments en str."""
        if v is None:
            return None
        if not isinstance(v, dict):
            return v
        return {k: str(val) if val is not None else "" for k, val in v.items()}

    @field_validator("decision", mode="before")
    @classmethod
    def normalize_decision(cls, v):
        """Convertit une chaîne vide en None."""
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v


def _build_report_data(report: ValidationReport) -> Dict[str, Any]:
    """Construit report_data pour admin_report (grille ou legacy)."""
    if report.ratings and len(report.ratings) > 0:
        # Format grille d'évaluation
        total_score_100 = _compute_weighted_score(report.ratings)
        overall_score = round(total_score_100 / 20, 2)  # 0-100 -> 0-5
        legacy = _derive_legacy_scores(report.ratings)
        summary = report.globalComment or report.summary or ""
        return {
            "overall_score": overall_score,
            "technical_skills_rating": legacy.get("technical_skills_rating"),
            "soft_skills_rating": legacy.get("soft_skills_rating"),
            "communication_rating": legacy.get("communication_rating"),
            "motivation_rating": legacy.get("motivation_rating"),
            "soft_skills_tags": report.softSkillsTags or [],
            "interview_notes": report.interview_notes or "",
            "recommendations": report.recommendations or "",
            "summary": summary,
            "ratings": report.ratings,
            "comments": report.comments or {},
            "global_comment": report.globalComment or "",
            "decision": report.decision or "",
            "total_score_100": total_score_100,
        }
    # Format legacy
    return {
        "overall_score": report.overallScore,
        "technical_skills_rating": report.technicalSkills,
        "soft_skills_rating": report.softSkills,
        "communication_rating": report.communication,
        "motivation_rating": report.motivation,
        "soft_skills_tags": report.softSkillsTags or [],
        "interview_notes": report.interview_notes or "",
        "recommendations": report.recommendations or "",
        "summary": report.summary or "",
    }


class RejectionReport(BaseModel):
    """Schéma pour le rapport de rejet"""
    rejectionReason: str = Field(min_length=10, description="Motif de rejet")
    overallScore: Optional[float] = Field(None, ge=0, le=5, description="Note globale")
    interview_notes: Optional[str] = Field(default="", description="Notes d'entretien")


class ProfileAskRequest(BaseModel):
    """Schéma pour une question en langage naturel sur un profil (CvGPT)"""
    question: str = Field(min_length=1, description="Question en langage naturel")


async def update_candidate_status_task(
    candidate_id: int,
    status: str,
    report_data: Dict[str, Any]
):
    """
    Tâche en arrière-plan pour mettre à jour le statut du candidat
    """
    try:
        await update_candidate_status(
            candidate_id=candidate_id,
            status=status,
            report_data=report_data
        )
    except Exception as e:
        # Logger l'erreur dans le service Audit
        await log_incident(
            incident_type="candidate_status_update_failed",
            description=f"Échec de la mise à jour du statut du candidat {candidate_id} à {status}: {str(e)}",
            candidate_id=candidate_id,
            metadata={"status": status, "error": str(e)}
        )


async def index_candidate_task(
    candidate_id: int,
    profile_data: Dict[str, Any]
):
    """
    Tâche en arrière-plan pour indexer le candidat dans ElasticSearch
    """
    try:
        success = await index_candidate_in_search(candidate_id, profile_data)
        if not success:
            # Logger l'échec dans le service Audit
            await log_incident(
                incident_type="indexation_failed",
                description=f"Échec de l'indexation ElasticSearch pour le candidat {candidate_id}",
                candidate_id=candidate_id,
                metadata={"profile_data_keys": list(profile_data.keys())}
            )
    except Exception as e:
        # Logger l'erreur dans le service Audit
        await log_incident(
            incident_type="indexation_failed",
            description=f"Erreur lors de l'indexation ElasticSearch pour le candidat {candidate_id}: {str(e)}",
            candidate_id=candidate_id,
            metadata={"error": str(e), "error_type": type(e).__name__}
        )


async def send_notification_task(
    recipient_email: str,
    recipient_name: str,
    candidate_name: Optional[str] = None,
    profile_url: Optional[str] = None
):
    """
    Tâche en arrière-plan pour envoyer une notification de profil validé
    """
    await send_profile_validated_notification(
        recipient_email=recipient_email,
        recipient_name=recipient_name,
        candidate_name=candidate_name,
        profile_url=profile_url
    )


async def remove_candidate_task(candidate_id: int):
    """
    Tâche en arrière-plan pour supprimer un candidat de l'index de recherche
    """
    await remove_candidate_from_search(candidate_id)


def _parse_validation_report(body: Any) -> ValidationReport:
    """Parse et valide le body en ValidationReport, avec logging en cas d'erreur."""
    body = body if body is not None else {}
    if not isinstance(body, dict):
        raise RequestValidationError([{"loc": ("body",), "msg": "Le corps de la requête doit être un objet JSON", "type": "type_error.dict"}])
    logger.info("validate body keys: %s", list(body.keys()))
    try:
        return ValidationReport.model_validate(body)
    except ValidationError as e:
        logger.warning("ValidationReport validation failed: %s", e.errors())
        raise RequestValidationError(e.errors()) from e


@router.post("/validate/{candidate_id}", status_code=status.HTTP_200_OK)
async def validate_candidate(
    candidate_id: int,
    background_tasks: BackgroundTasks,
    admin_user=Depends(require_admin_role),
    body: Optional[Dict[str, Any]] = Body(default=None),
):
    """
    Valide un profil candidat avec actions asynchrones via BackgroundTasks
    
    Déclenche trois actions asynchrones :
    1. Mettre à jour le statut à 'VALIDATED' dans le Candidate Service
    2. Indexer le candidat dans ElasticSearch via le Search Service
    3. Envoyer une notification email au candidat via le Notification Service
    
    Si l'indexation ElasticSearch échoue, l'incident est loggé dans le Service Audit.
    """
    report = _parse_validation_report(body)
    try:
        # Validation : résumé requis pour valider (min 20 caractères)
        summary_text = report.globalComment or report.summary or ""
        if len(summary_text.strip()) < 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le résumé de l'évaluation doit contenir au moins 20 caractères pour valider le profil."
            )
        # Récupérer le profil complet du candidat
        profile_response = await get_candidate_profile(candidate_id)
        profile_data = profile_response  # Le profil est déjà au format dict
        
        # Préparer les données du rapport (format grille ou legacy)
        report_data = _build_report_data(report)
        report_data["summary"] = summary_text
        
        # Récupérer les informations du candidat pour la notification
        recipient_email = profile_data.get("email", "")
        recipient_name = f"{profile_data.get('first_name', '')} {profile_data.get('last_name', '')}".strip()
        if not recipient_name:
            recipient_name = recipient_email
        
        # Construire l'URL du profil (optionnel)
        from app.core.config import settings
        profile_url = f"{settings.FRONTEND_URL}/candidate/{candidate_id}" if hasattr(settings, 'FRONTEND_URL') else None
        
        # ============================================
        # ACTION SYNCHRONE : Mettre à jour le statut
        # ============================================
        # Mettre à jour le statut de façon synchrone pour que le frontend voie le changement immédiatement
        await update_candidate_status(
            candidate_id=candidate_id,
            status="VALIDATED",
            report_data=report_data
        )
        
        # ============================================
        # ACTIONS : Indexation (synchrone pour garantir l'indexation immédiate) et notification (asynchrone)
        # ============================================
        # Fusionner le rapport dans profile_data pour l'indexation (admin_score, admin_report)
        profile_data_for_index = {**profile_data}
        if report_data:
            profile_data_for_index["admin_score"] = report_data.get("overall_score")
            profile_data_for_index["admin_report"] = report_data
        
        # Action 1 : Indexer dans ElasticSearch de manière synchrone pour garantir l'indexation immédiate
        # Cela permet au profil d'être visible dans la CVthèque immédiatement après validation
        try:
            await index_candidate_in_search(candidate_id, profile_data_for_index)
            indexation_status = "completed"
            indexation_error = None
        except Exception as index_error:
            # Si l'indexation synchrone échoue, la relancer en asynchrone avec logging
            indexation_status = "failed"
            indexation_error = str(index_error)
            print(f"⚠️ Indexation synchrone échouée pour le candidat {candidate_id}, relance en asynchrone: {index_error}")
            background_tasks.add_task(
                index_candidate_task,
                candidate_id=candidate_id,
                profile_data=profile_data_for_index
            )
        
        # Action 2 : Envoyer la notification au candidat
        background_tasks.add_task(
            send_notification_task,
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            candidate_name=recipient_name,
            profile_url=profile_url
        )
        
        return {
            "message": "Candidate profile validated successfully",
            "candidate_id": candidate_id,
            "status": "VALIDATED",
            "actions": {
                "status_update": "completed",
                "indexation": indexation_status,
                "notification": "pending"
            },
            "indexation_error": indexation_error,
            "note": "Status updated. Profile indexed in CV library. Notification is being processed asynchronously."
        }
        
    except HTTPException:
        # Re-raise les HTTPException
        raise
    except CandidateNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate candidate validation: {str(e)}"
        )


@router.post("/reject/{candidate_id}", status_code=status.HTTP_200_OK)
async def reject_candidate(
    candidate_id: int,
    background_tasks: BackgroundTasks,
    admin_user=Depends(require_admin_role),
    report: RejectionReport = Body(..., embed=False),
):
    """
    Rejette un profil candidat
    
    - Met à jour le statut à 'REJECTED' dans le service candidat
    - Déclenche un appel asynchrone pour supprimer le candidat de l'index de recherche
    """
    try:
        # Préparer les données du rapport
        report_data = {
            "rejection_reason": report.rejectionReason,
            "overall_score": report.overallScore,
            "interview_notes": report.interview_notes or "",
        }
        
        # Mettre à jour le statut dans le service candidat
        await update_candidate_status(
            candidate_id=candidate_id,
            status="REJECTED",
            report_data=report_data
        )
        
        # Déclencher la suppression de l'index de manière asynchrone
        background_tasks.add_task(remove_candidate_task, candidate_id)
        
        return {
            "message": "Candidate profile rejected successfully",
            "candidate_id": candidate_id,
            "status": "REJECTED",
            "removed_from_index": "pending"  # La suppression est en cours en arrière-plan
        }
        
    except CandidateNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject candidate: {str(e)}"
        )


@router.post("/update-evaluation/{candidate_id}", status_code=status.HTTP_200_OK)
async def update_evaluation(
    candidate_id: int,
    admin_user=Depends(require_admin_role),
    report: ValidationReport = Body(..., embed=False),
):
    """
    Met à jour l'évaluation d'un candidat (admin_report, admin_score) sans changer le statut.
    Utile pour modifier l'évaluation d'un profil déjà validé avec ses nouvelles informations.
    Réindexe le candidat dans la CVthèque avec les données mises à jour.
    """
    try:
        report_data = _build_report_data(report)
        await update_candidate_evaluation(candidate_id=candidate_id, report_data=report_data)

        # Réindexer avec les données à jour (profil inclut déjà admin_report mis à jour)
        profile_data_updated = await get_candidate_profile(candidate_id)
        try:
            await index_candidate_in_search(candidate_id, profile_data_updated)
        except Exception as index_err:
            logger.warning("Indexation après mise à jour évaluation échouée pour %s: %s", candidate_id, index_err)

        return {
            "message": "Evaluation updated successfully",
            "candidate_id": candidate_id,
        }
    except CandidateNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update evaluation: {str(e)}"
        )


@router.post("/archive/{candidate_id}", status_code=status.HTTP_200_OK)
async def archive_candidate(
    candidate_id: int,
    background_tasks: BackgroundTasks,
    admin_user=Depends(require_admin_role),
):
    """
    Archive un profil candidat
    
    - Met à jour le statut à 'ARCHIVED' dans le service candidat
    - Déclenche un appel asynchrone pour supprimer le candidat de l'index de recherche
    """
    try:
        # Mettre à jour le statut dans le service candidat
        await update_candidate_status(
            candidate_id=candidate_id,
            status="ARCHIVED"
        )
        
        # Déclencher la suppression de l'index de manière asynchrone
        background_tasks.add_task(remove_candidate_task, candidate_id)
        
        return {
            "message": "Candidate profile archived successfully",
            "candidate_id": candidate_id,
            "status": "ARCHIVED",
            "removed_from_index": "pending"
        }
        
    except CandidateNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found"
        )
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e)
        # 502 si le service candidat est inaccessible
        status_code = status.HTTP_502_BAD_GATEWAY if "Impossible de joindre" in err_msg else status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(
            status_code=status_code,
            detail=err_msg
        )


@router.post("/unarchive/{candidate_id}", status_code=status.HTTP_200_OK)
async def unarchive_candidate(
    candidate_id: int,
    background_tasks: BackgroundTasks,
    admin_user=Depends(require_admin_role),
):
    """
    Déarchive un profil candidat.

    - Met à jour le statut à 'VALIDATED' dans le service candidat
    - Réindexe le candidat dans l'index de recherche (CVthèque)
    - Restaure le profil dans la liste de validation (visible sous le filtre VALIDATED)
    """
    try:
        # Récupérer le profil complet pour l'indexation
        profile_data = await get_candidate_profile(candidate_id)
        if profile_data.get("status") != "ARCHIVED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seuls les profils archivés peuvent être déarchivés",
            )

        # Mettre à jour le statut dans le service candidat
        await update_candidate_status(
            candidate_id=candidate_id,
            status="VALIDATED",
        )

        # Réindexer dans l'index de recherche (synchrone pour cohérence)
        try:
            await index_candidate_in_search(candidate_id, profile_data)
            indexation_status = "completed"
        except Exception as index_err:
            logger.warning("Indexation synchrone échouée pour déarchivage %s: %s", candidate_id, index_err)
            background_tasks.add_task(index_candidate_task, candidate_id, profile_data)
            indexation_status = "pending"

        return {
            "message": "Candidate profile unarchived successfully",
            "candidate_id": candidate_id,
            "status": "VALIDATED",
            "indexed_in_search": indexation_status,
        }

    except CandidateNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unarchive candidate: {str(e)}",
        )


@router.post("/delete/{candidate_id}", status_code=status.HTTP_200_OK)
async def delete_candidate(
    candidate_id: int,
    background_tasks: BackgroundTasks,
    admin_user=Depends(require_admin_role),
):
    """
    Supprime un profil candidat (soft delete).

    - Marque le profil comme supprimé (deleted_at) dans le service candidat
    - Déclenche un appel asynchrone pour retirer le candidat de l'index de recherche
    """
    try:
        await delete_candidate_profile(candidate_id=candidate_id)
        background_tasks.add_task(remove_candidate_task, candidate_id)
        return {
            "message": "Candidate profile deleted successfully",
            "candidate_id": candidate_id,
        }
    except CandidateNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete candidate: {str(e)}",
        )


def _empty_evaluation_response(candidate_id: int) -> dict:
    """Réponse vide pour le formulaire d'évaluation (fallback en cas d'erreur)."""
    return {
        "candidate_id": candidate_id,
        "candidate_name": "",
        "overall_score": None,
        "technical_skills_rating": None,
        "soft_skills_rating": None,
        "communication_rating": None,
        "motivation_rating": None,
        "soft_skills_tags": [],
        "interview_notes": None,
        "recommendations": None,
        "summary": None,
        "ratings": None,
        "comments": None,
        "global_comment": None,
        "decision": None,
        "total_score_100": None,
        "validated_at": None,
    }


@router.get("/evaluation/{candidate_id}", status_code=status.HTTP_200_OK)
async def get_candidate_evaluation(
    candidate_id: int,
    admin_user=Depends(require_admin_role),
):
    """
    Récupère le rapport d'évaluation d'un candidat.
    
    Retourne le compte-rendu rédigé par l'Admin lors de la validation.
    Si le candidat n'a pas encore été évalué, retourne 200 avec des valeurs vides
    (pour permettre au formulaire d'évaluation de s'afficher sans erreur 404).
    En cas d'erreur de communication avec le service candidat, retourne aussi
    des valeurs vides pour permettre à l'admin de continuer (validation/rejet).
    
    **Usage** : Appelé par le frontend pour charger le formulaire d'évaluation.
    """
    try:
        profile_data = await get_candidate_profile(candidate_id)
        admin_report = profile_data.get("admin_report") or {}
        return {
            "candidate_id": candidate_id,
            "candidate_name": f"{profile_data.get('first_name', '')} {profile_data.get('last_name', '')}".strip(),
            "overall_score": admin_report.get("overall_score"),
            "technical_skills_rating": admin_report.get("technical_skills_rating"),
            "soft_skills_rating": admin_report.get("soft_skills_rating"),
            "communication_rating": admin_report.get("communication_rating"),
            "motivation_rating": admin_report.get("motivation_rating"),
            "soft_skills_tags": admin_report.get("soft_skills_tags", []),
            "interview_notes": admin_report.get("interview_notes"),
            "recommendations": admin_report.get("recommendations"),
            "summary": admin_report.get("summary"),
            "ratings": admin_report.get("ratings"),
            "comments": admin_report.get("comments"),
            "global_comment": admin_report.get("global_comment"),
            "decision": admin_report.get("decision"),
            "total_score_100": admin_report.get("total_score_100"),
            "validated_at": profile_data.get("validated_at"),
        }
    except CandidateNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(
            "Failed to fetch candidate profile for evaluation (candidate_id=%s): %s. Returning empty form.",
            candidate_id, str(e)
        )
        return _empty_evaluation_response(candidate_id)


@router.post("/index-cv/{candidate_id}", status_code=status.HTTP_200_OK)
async def index_cv_for_candidate(
    candidate_id: int,
    file: UploadFile = File(..., description="Fichier CV (PDF ou DOCX)"),
    admin_user=Depends(require_admin_role),
):
    """
    Indexe un CV pour un profil existant afin d'activer l'analyse IA (CvGPT).

    Pour les profils créés sans CV ou sans indexation HrFlow, l'admin peut uploader
    un CV pour activer l'analyse par IA dans la section Synthèse.
    """
    if not file.filename or not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format de fichier non supporté. Utilisez un PDF ou DOCX.",
        )
    try:
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fichier trop volumineux (max 10 Mo).")
        profile_key = await parse_cv_and_get_key(content, file.filename or "cv.pdf")
        if not profile_key:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Le parsing HrFlow n'a pas retourné de clé. Vérifiez HRFLOW_API_KEY et HRFLOW_SOURCE_KEY.",
            )
        await update_candidate_hrflow_key(candidate_id, profile_key)
        return {"message": "CV indexé avec succès. L'analyse IA est maintenant disponible.", "hrflow_profile_key": profile_key}
    except CandidateNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Candidat {candidate_id} non trouvé")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/profile-ask/{candidate_id}", status_code=status.HTTP_200_OK)
async def profile_ask(
    candidate_id: int,
    body: ProfileAskRequest,
    admin_user=Depends(require_admin_role),
):
    """
    Pose une question en langage naturel sur le profil candidat (API HrFlow Profile Asking / CvGPT).

    Le profil doit avoir été indexé dans HrFlow (création depuis un CV avec indexation).
    Réponse générée par l'IA pour aider à la synthèse d'évaluation.
    """
    try:
        profile_data = await get_candidate_profile(candidate_id)
        hrflow_key = profile_data.get("hrflow_profile_key")
        if not hrflow_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ce profil n'est pas disponible pour l'analyse IA (CvGPT). "
                       "Seuls les profils créés à partir d'un CV avec indexation HrFlow le sont.",
            )
        answer = await ask_profile(hrflow_key, body.question)
        return {"answer": answer}
    except HrFlowAskingError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except CandidateNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id {candidate_id} not found",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("profile_ask unexpected error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {e}",
        )

