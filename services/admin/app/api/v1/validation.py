"""
Endpoints de validation des profils candidats
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from app.infrastructure.candidate_client import get_candidate_profile, update_candidate_status
from app.infrastructure.search_client import index_candidate_in_search, remove_candidate_from_search
from app.infrastructure.notification_client import send_profile_validated_notification
from app.infrastructure.audit_client import log_incident
from app.core.exceptions import CandidateNotFoundError

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
    background_tasks: BackgroundTasks
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
        # Action 1 : Indexer dans ElasticSearch de manière synchrone pour garantir l'indexation immédiate
        # Cela permet au profil d'être visible dans la CVthèque immédiatement après validation
        try:
            await index_candidate_in_search(candidate_id, profile_data)
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
                profile_data=profile_data
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
    background_tasks: BackgroundTasks
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


@router.post("/archive/{candidate_id}", status_code=status.HTTP_200_OK)
async def archive_candidate(
    candidate_id: int,
    background_tasks: BackgroundTasks
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to archive candidate: {str(e)}"
        )


@router.get("/evaluation/{candidate_id}", status_code=status.HTTP_200_OK)
async def get_candidate_evaluation(candidate_id: int):
    """
    Récupère le rapport d'évaluation d'un candidat validé
    
    Retourne le compte-rendu rédigé par l'Admin lors de la validation.
    Ce rapport est stocké dans le Candidate Service dans le champ `admin_report`.
    
    **Usage** : Appelé par le frontend pour afficher l'avis de l'expert aux recruteurs.
    """
    try:
        # Récupérer le profil complet depuis le Candidate Service
        profile_data = await get_candidate_profile(candidate_id)
        
        # Extraire le rapport d'évaluation
        admin_report = profile_data.get("admin_report")
        
        if not admin_report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No evaluation report found for candidate {candidate_id}. The candidate may not have been validated yet."
            )
        
        # Retourner le rapport formaté
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
        # Re-raise les HTTPException
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve candidate evaluation: {str(e)}"
        )

