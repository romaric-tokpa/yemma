"""
Endpoints internes pour les triggers de notification
Ces endpoints sont appelés par les autres services de la plateforme
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field, ConfigDict

from app.infrastructure.database import get_session
from app.infrastructure.background_tasks import send_notification_task
from app.core.config import settings
from app.infrastructure.repositories import NotificationRepository
from app.domain.models import Notification, NotificationStatus
import json
from datetime import datetime

# Importer la vérification du token interne (shared copié dans /shared)
try:
    from shared.fastapi_deps import verify_internal_token
except ImportError:
    from fastapi import Header
    async def verify_internal_token(x_service_token: str = Header(None, alias="X-Service-Token")):
        """Fallback : vérification basique du token interne"""
        if not x_service_token:
            raise HTTPException(status_code=401, detail="Missing X-Service-Token")
        return {"service": "internal"}

router = APIRouter()


class ValidationNotificationRequest(BaseModel):
    """Requête pour notifier une validation de profil"""
    candidate_email: str = Field(..., description="Email du candidat")
    candidate_name: str = Field(..., description="Nom du candidat")
    profile_url: str = Field(default="", description="URL du profil candidat")


class RejectionNotificationRequest(BaseModel):
    """Requête pour notifier un rejet de profil"""
    candidate_email: str = Field(..., description="Email du candidat")
    candidate_name: str = Field(..., description="Nom du candidat")
    rejection_reason: str = Field(..., description="Motif du rejet")
    profile_url: str = Field(default="", description="URL du profil candidat")


class InvitationNotificationRequest(BaseModel):
    """Requête pour notifier une invitation de recruteur"""
    model_config = ConfigDict(from_attributes=True)
    
    recipient_email: str = Field(..., description="Email du recruteur invité")
    recipient_name: str = Field(..., description="Nom du recruteur")
    company_name: str = Field(..., description="Nom de l'entreprise")
    invitation_token: str = Field(default="", description="Token d'invitation (peut être vide si on utilise password reset)")
    invitation_url: str = Field(default="", description="URL d'acceptation de l'invitation")
    temporary_password: Optional[str] = Field(default=None, description="Mot de passe temporaire (si le compte a été créé)")


class CandidateWelcomeRequest(BaseModel):
    """Requête pour envoyer un email à un candidat après soumission de son profil pour validation"""
    candidate_email: str = Field(..., description="Email du candidat")
    candidate_name: str = Field(..., description="Nom du candidat")
    dashboard_url: str = Field(default="", description="URL du tableau de bord candidat")


class CandidateProfileCreatedRequest(BaseModel):
    """Requête pour envoyer un email au candidat après création de son profil (onboarding complété)"""
    candidate_email: str = Field(..., description="Email du candidat")
    candidate_name: str = Field(..., description="Nom du candidat")
    dashboard_url: str = Field(default="", description="URL du tableau de bord candidat")


class CandidateRegistrationRequest(BaseModel):
    """Requête pour envoyer un email au candidat après création de son compte (avant onboarding)"""
    candidate_email: str = Field(..., description="Email du candidat")
    candidate_name: str = Field(..., description="Nom du candidat (prénom + nom ou email)")
    onboarding_url: str = Field(default="", description="URL de la page d'onboarding")


class AdminValidationRequestNotification(BaseModel):
    """Requête pour notifier l'admin qu'un candidat demande la validation de son profil"""
    candidate_email: str = Field(..., description="Email du candidat")
    candidate_name: str = Field(..., description="Nom du candidat")
    profile_id: int = Field(..., description="ID du profil candidat")
    profile_url: str = Field(default="", description="URL du profil candidat (espace admin)")


class CompanyWelcomeRequest(BaseModel):
    """Requête pour envoyer un email de bienvenue à une entreprise après création du compte"""
    recipient_email: str = Field(..., description="Email du recruteur/admin")
    recipient_name: str = Field(..., description="Nom du recruteur/admin")
    company_name: str = Field(..., description="Nom de l'entreprise")
    dashboard_url: str = Field(default="", description="URL du tableau de bord entreprise")


class CompanyRegistrationRequest(BaseModel):
    """Requête pour envoyer un email au recruteur après inscription (compte créé, avant création entreprise)"""
    recipient_email: str = Field(..., description="Email du recruteur")
    recipient_name: str = Field(..., description="Nom du recruteur (prénom + nom ou email)")
    onboarding_url: str = Field(default="", description="URL de la page onboarding entreprise")


class CompanyOnboardingCompletedRequest(BaseModel):
    """Requête pour envoyer un email au recruteur après complétion de l'onboarding entreprise"""
    recipient_email: str = Field(..., description="Email du recruteur")
    recipient_name: str = Field(..., description="Nom du recruteur")
    company_name: str = Field(..., description="Nom de l'entreprise")
    dashboard_url: str = Field(default="", description="URL du tableau de bord entreprise")


class PasswordResetRequest(BaseModel):
    """Requête pour envoyer un email de réinitialisation de mot de passe"""
    recipient_email: str = Field(..., description="Email de l'utilisateur")
    reset_url: str = Field(..., description="URL complète du lien de réinitialisation (avec token)")
    recipient_name: Optional[str] = Field(default=None, description="Nom de l'utilisateur")


@router.post("/notify_validation", status_code=status.HTTP_202_ACCEPTED)
async def notify_validation(
    request: ValidationNotificationRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email de félicitations au candidat quand son profil est VALIDATED
    
    Appelé par le Admin Service après validation d'un profil.
    """
    try:
        # Créer l'enregistrement de notification
        notification_repo = NotificationRepository(session)
        
        template_data = {
            "candidate_name": request.candidate_name,
            "profile_url": request.profile_url or f"{settings.FRONTEND_URL}/candidate/profile"
        }
        
        notification = Notification(
            notification_type="profile_validated",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        
        notification = await notification_repo.create(notification)
        
        # Ajouter la tâche d'envoi en arrière-plan
        background_tasks.add_task(
            send_notification_task,
            notification_type="profile_validated",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=template_data,
            notification_id=notification.id
        )
        
        return {
            "message": "Validation notification queued",
            "notification_id": notification.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue validation notification: {str(e)}"
        )


@router.post("/notify_rejection", status_code=status.HTTP_202_ACCEPTED)
async def notify_rejection(
    request: RejectionNotificationRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email au candidat avec le motif du refus quand le statut est REJECTED
    
    Appelé par le Admin Service après rejet d'un profil.
    """
    try:
        # Créer l'enregistrement de notification
        notification_repo = NotificationRepository(session)
        
        template_data = {
            "candidate_name": request.candidate_name,
            "rejection_reason": request.rejection_reason,
            "profile_url": request.profile_url or f"{settings.FRONTEND_URL}/candidate/profile"
        }
        
        notification = Notification(
            notification_type="profile_rejected",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        
        notification = await notification_repo.create(notification)
        
        # Ajouter la tâche d'envoi en arrière-plan
        background_tasks.add_task(
            send_notification_task,
            notification_type="profile_rejected",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=template_data,
            notification_id=notification.id
        )
        
        return {
            "message": "Rejection notification queued",
            "notification_id": notification.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue rejection notification: {str(e)}"
        )


@router.post("/notify_invitation", status_code=status.HTTP_202_ACCEPTED)
async def notify_invitation(
    request: InvitationNotificationRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email avec un lien magique (token) lorsqu'un Admin d'Entreprise invite un nouveau recruteur
    
    Appelé par le Company Service lors de l'invitation d'un recruteur.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Received invitation notification request for {request.recipient_email}")
    logger.debug(f"Request data: recipient_name={request.recipient_name}, company_name={request.company_name}, temporary_password={'***' if request.temporary_password else None}")
    
    try:
        # Créer l'enregistrement de notification
        notification_repo = NotificationRepository(session)
        
        invitation_url = request.invitation_url or f"{settings.FRONTEND_URL}/invitation/accept?token={request.invitation_token}"
        
        template_data = {
            "recipient_email": request.recipient_email,
            "recipient_name": request.recipient_name,  # Important : inclure recipient_name pour le template
            "company_name": request.company_name,
            "invitation_token": request.invitation_token,
            "invitation_url": invitation_url,
            "temporary_password": request.temporary_password
        }
        
        notification = Notification(
            notification_type="recruiter_invitation",
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        
        notification = await notification_repo.create(notification)
        
        # Ajouter la tâche d'envoi en arrière-plan
        background_tasks.add_task(
            send_notification_task,
            notification_type="recruiter_invitation",
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            template_data=template_data,
            notification_id=notification.id
        )
        
        return {
            "message": "Invitation notification queued",
            "notification_id": notification.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue invitation notification: {str(e)}"
        )


@router.post("/notify_candidate_profile_created", status_code=status.HTTP_202_ACCEPTED)
async def notify_candidate_profile_created(
    request: CandidateProfileCreatedRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email au candidat après création de son profil (onboarding complété avec parsing CV).
    Appelé par le Candidate Service après complétion de l'onboarding.
    """
    try:
        notification_repo = NotificationRepository(session)
        dashboard_url = request.dashboard_url or f"{settings.FRONTEND_URL}/candidate/dashboard"
        template_data = {
            "recipient_name": request.candidate_name,
            "candidate_name": request.candidate_name,
            "dashboard_url": dashboard_url
        }
        notification = Notification(
            notification_type="candidate_profile_created",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        notification = await notification_repo.create(notification)
        background_tasks.add_task(
            send_notification_task,
            notification_type="candidate_profile_created",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=template_data,
            notification_id=notification.id,
        )
        return {
            "message": "Candidate profile created notification queued",
            "notification_id": notification.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue candidate profile created notification: {str(e)}"
        )


@router.post("/notify_candidate_welcome", status_code=status.HTTP_202_ACCEPTED)
async def notify_candidate_welcome(
    request: CandidateWelcomeRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email de bienvenue au candidat après complétion de l'onboarding
    
    Appelé par le Candidate Service après soumission du profil.
    """
    try:
        # Créer l'enregistrement de notification
        notification_repo = NotificationRepository(session)
        
        dashboard_url = request.dashboard_url or f"{settings.FRONTEND_URL}/candidate/dashboard"
        
        template_data = {
            "recipient_name": request.candidate_name,
            "candidate_name": request.candidate_name,
            "dashboard_url": dashboard_url
        }
        
        notification = Notification(
            notification_type="candidate_welcome",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        
        notification = await notification_repo.create(notification)
        
        # Ajouter la tâche d'envoi en arrière-plan
        background_tasks.add_task(
            send_notification_task,
            notification_type="candidate_welcome",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=template_data,
            notification_id=notification.id
        )
        
        return {
            "message": "Candidate welcome notification queued",
            "notification_id": notification.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue candidate welcome notification: {str(e)}"
        )


@router.post("/notify_candidate_registration", status_code=status.HTTP_202_ACCEPTED)
async def notify_candidate_registration(
    request: CandidateRegistrationRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email au candidat après création de son compte (inscription),
    pour l'informer que son compte est créé et qu'il doit suivre le processus d'onboarding.

    Appelé par le Auth Service après inscription d'un candidat (register avec rôle ROLE_CANDIDAT).
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info("notify_candidate_registration: reçu pour %s (%s)", request.candidate_email, request.candidate_name)
    try:
        notification_repo = NotificationRepository(session)
        onboarding_url = request.onboarding_url or f"{settings.FRONTEND_URL}/onboarding"

        template_data = {
            "recipient_name": request.candidate_name,
            "candidate_name": request.candidate_name,
            "onboarding_url": onboarding_url,
        }

        notification = Notification(
            notification_type="candidate_account_created",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )

        notification = await notification_repo.create(notification)
        logger.info("notify_candidate_registration: notification créée id=%s, enqueue envoi email", notification.id)

        background_tasks.add_task(
            send_notification_task,
            notification_type="candidate_account_created",
            recipient_email=request.candidate_email,
            recipient_name=request.candidate_name,
            template_data=template_data,
            notification_id=notification.id,
        )

        return {
            "message": "Candidate registration notification queued",
            "notification_id": notification.id,
            "status": "pending",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue candidate registration notification: {str(e)}",
        )


@router.post("/notify_admin_validation_request", status_code=status.HTTP_202_ACCEPTED)
async def notify_admin_validation_request(
    request: AdminValidationRequestNotification,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email à l'administrateur quand un candidat demande la validation de son profil.
    Appelé par le Candidate Service.
    """
    try:
        notification_repo = NotificationRepository(session)
        profile_url = request.profile_url or f"{settings.FRONTEND_URL}/admin/review/{request.profile_id}"
        template_data = {
            "candidate_name": request.candidate_name,
            "candidate_email": request.candidate_email,
            "profile_id": request.profile_id,
            "profile_url": profile_url,
        }
        admin_email = settings.ADMIN_EMAIL
        notification = Notification(
            notification_type="admin_validation_request",
            recipient_email=admin_email,
            recipient_name="Administrateur",
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        notification = await notification_repo.create(notification)
        background_tasks.add_task(
            send_notification_task,
            notification_type="admin_validation_request",
            recipient_email=admin_email,
            recipient_name="Administrateur",
            template_data=template_data,
            notification_id=notification.id,
        )
        return {
            "message": "Admin validation request notification queued",
            "notification_id": notification.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue admin validation request notification: {str(e)}"
        )


@router.post("/notify_company_registration", status_code=status.HTTP_202_ACCEPTED)
async def notify_company_registration(
    request: CompanyRegistrationRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email au recruteur après inscription (compte créé).
    Pour l'informer que son compte est créé et qu'il peut compléter l'onboarding entreprise.
    Appelé par le Auth Service après register avec rôle ROLE_COMPANY_ADMIN.
    """
    import logging
    logger = logging.getLogger(__name__)
    try:
        notification_repo = NotificationRepository(session)
        onboarding_url = request.onboarding_url or f"{settings.FRONTEND_URL}/company/onboarding"
        template_data = {
            "recipient_name": request.recipient_name,
            "onboarding_url": onboarding_url,
        }
        notification = Notification(
            notification_type="company_account_created",
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        notification = await notification_repo.create(notification)
        logger.info("notify_company_registration: reçu pour %s (%s)", request.recipient_email, request.recipient_name)
        background_tasks.add_task(
            send_notification_task,
            notification_type="company_account_created",
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            template_data=template_data,
            notification_id=notification.id,
        )
        logger.info("notify_company_registration: notification créée id=%s, enqueue envoi email", notification.id)
        return {
            "message": "Company registration notification queued",
            "notification_id": notification.id,
            "status": "pending",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue company registration notification: {str(e)}",
        )


@router.post("/notify_password_reset", status_code=status.HTTP_202_ACCEPTED)
async def notify_password_reset(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email de réinitialisation de mot de passe à l'utilisateur.
    Appelé par le Auth Service après génération du token de réinitialisation.
    """
    try:
        notification_repo = NotificationRepository(session)
        template_data = {
            "reset_url": request.reset_url,
        }
        recipient_name = request.recipient_name or request.recipient_email.split("@")[0]
        notification = Notification(
            notification_type="password_reset",
            recipient_email=request.recipient_email,
            recipient_name=recipient_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        notification = await notification_repo.create(notification)
        background_tasks.add_task(
            send_notification_task,
            notification_type="password_reset",
            recipient_email=request.recipient_email,
            recipient_name=recipient_name,
            template_data=template_data,
            notification_id=notification.id,
        )
        return {
            "message": "Password reset notification queued",
            "notification_id": notification.id,
            "status": "pending",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue password reset notification: {str(e)}",
        )


@router.post("/notify_company_welcome", status_code=status.HTTP_202_ACCEPTED)
async def notify_company_welcome(
    request: CompanyWelcomeRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email de bienvenue à une entreprise après création du compte
    
    Appelé par le Company Service après création d'une entreprise.
    """
    try:
        # Créer l'enregistrement de notification
        notification_repo = NotificationRepository(session)
        
        dashboard_url = request.dashboard_url or f"{settings.FRONTEND_URL}/company/dashboard"
        
        template_data = {
            "recipient_name": request.recipient_name,
            "company_name": request.company_name,
            "dashboard_url": dashboard_url
        }
        
        notification = Notification(
            notification_type="company_welcome",
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        
        notification = await notification_repo.create(notification)
        
        # Ajouter la tâche d'envoi en arrière-plan
        background_tasks.add_task(
            send_notification_task,
            notification_type="company_welcome",
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            template_data=template_data,
            notification_id=notification.id
        )
        
        return {
            "message": "Company welcome notification queued",
            "notification_id": notification.id,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue company welcome notification: {str(e)}"
        )


@router.post("/notify_company_onboarding_completed", status_code=status.HTTP_202_ACCEPTED)
async def notify_company_onboarding_completed(
    request: CompanyOnboardingCompletedRequest,
    background_tasks: BackgroundTasks,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger interne : Envoie un email au recruteur après complétion de l'onboarding entreprise.
    Appelé par le Company Service après mise à jour (finalisation) de l'entreprise.
    """
    import logging
    logger = logging.getLogger(__name__)
    try:
        notification_repo = NotificationRepository(session)
        dashboard_url = request.dashboard_url or f"{settings.FRONTEND_URL}/company/dashboard"
        template_data = {
            "recipient_name": request.recipient_name,
            "company_name": request.company_name,
            "dashboard_url": dashboard_url,
        }
        notification = Notification(
            notification_type="company_onboarding_completed",
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            template_data=json.dumps(template_data),
            status=NotificationStatus.PENDING,
        )
        notification = await notification_repo.create(notification)
        logger.info("notify_company_onboarding_completed: reçu pour %s (%s)", request.recipient_email, request.company_name)
        background_tasks.add_task(
            send_notification_task,
            notification_type="company_onboarding_completed",
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            template_data=template_data,
            notification_id=notification.id,
        )
        return {
            "message": "Company onboarding completed notification queued",
            "notification_id": notification.id,
            "status": "pending",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue company onboarding completed notification: {str(e)}",
        )

