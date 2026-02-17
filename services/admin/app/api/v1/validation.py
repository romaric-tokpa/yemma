"""
Endpoints de validation des profils candidats
"""
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, File, UploadFile
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

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


class ValidationReport(BaseModel):
    """Schéma pour le rapport de validation"""
    overallScore: float = Field(ge=0, le=5, description="Note globale sur 5")
    technicalSkills: Optional[float] = Field(None, ge=0, le=5, description="Note compétences techniques")
    softSkills: Optional[float] = Field(None, ge=0, le=5, description="Note soft skills")
    communication: Optional[float] = Field(None, ge=0, le=5, description="Note communication")
    motivation: Optional[float] = Field(None, ge=0, le=5, description="Note motivation")
    softSkillsTags: Optional[list[str]] = Field(default=[], description="Tags soft skills")
    interview_notes: Optional[str] = Field(default="", description="Notes d'entretien")
    recommendations: Optional[str] = Field(default="", description="Recommandations")
    summary: str = Field(min_length=50, description="Résumé de l'évaluation")


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


@router.post("/validate/{candidate_id}", status_code=status.HTTP_200_OK)
async def validate_candidate(
    candidate_id: int,
    report: ValidationReport,
    background_tasks: BackgroundTasks,
    admin_user=Depends(require_admin_role),
):
    """
    Valide un profil candidat avec actions asynchrones via BackgroundTasks
    
    Déclenche trois actions asynchrones :
    1. Mettre à jour le statut à 'VALIDATED' dans le Candidate Service
    2. Indexer le candidat dans ElasticSearch via le Search Service
    3. Envoyer une notification email au candidat via le Notification Service
    
    Si l'indexation ElasticSearch échoue, l'incident est loggé dans le Service Audit.
    """
    try:
        # Récupérer le profil complet du candidat
        profile_response = await get_candidate_profile(candidate_id)
        profile_data = profile_response  # Le profil est déjà au format dict
        
        # Préparer les données du rapport
        report_data = {
            "overall_score": report.overallScore,
            "technical_skills_rating": report.technicalSkills,
            "soft_skills_rating": report.softSkills,
            "communication_rating": report.communication,
            "motivation_rating": report.motivation,
            "soft_skills_tags": report.softSkillsTags or [],
            "interview_notes": report.interview_notes or "",
            "recommendations": report.recommendations or "",
            "summary": report.summary,
        }
        
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
    report: RejectionReport,
    background_tasks: BackgroundTasks,
    admin_user=Depends(require_admin_role),
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
    report: ValidationReport,
    admin_user=Depends(require_admin_role),
):
    """
    Met à jour l'évaluation d'un candidat (admin_report, admin_score) sans changer le statut.
    Utile pour modifier l'évaluation d'un profil déjà validé avec ses nouvelles informations.
    Réindexe le candidat dans la CVthèque avec les données mises à jour.
    """
    try:
        report_data = {
            "overall_score": report.overallScore,
            "technical_skills_rating": report.technicalSkills,
            "soft_skills_rating": report.softSkills,
            "communication_rating": report.communication,
            "motivation_rating": report.motivation,
            "soft_skills_tags": report.softSkillsTags or [],
            "interview_notes": report.interview_notes or "",
            "recommendations": report.recommendations or "",
            "summary": report.summary,
        }

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

