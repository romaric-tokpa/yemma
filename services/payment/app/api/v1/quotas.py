"""
Endpoints de gestion des quotas
"""
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.schemas import QuotaCheckRequest, QuotaCheckResponse, QuotaUsageRequest, QuotaCheckAndUseResponse
from app.core.exceptions import QuotaExceededError, SubscriptionNotFoundError
from app.infrastructure.database import get_session
from app.infrastructure.repositories import (
    SubscriptionRepository,
    PlanRepository,
    QuotaRepository,
)

router = APIRouter()


@router.post("/check", response_model=QuotaCheckResponse)
async def check_quota(
    request: QuotaCheckRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Vérifie si un quota est disponible pour une entreprise
    
    - **company_id**: ID de l'entreprise
    - **quota_type**: Type de quota (profile_views, etc.)
    """
    subscription_repo = SubscriptionRepository(session)
    subscription = await subscription_repo.get_by_company_id(request.company_id)
    
    if not subscription:
        raise SubscriptionNotFoundError(f"company_{request.company_id}")
    
    # Récupérer le plan
    plan_repo = PlanRepository(session)
    plan = await plan_repo.get_by_id(subscription.plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Récupérer le quota actuel
    quota_repo = QuotaRepository(session)
    quota = await quota_repo.get_current_quota(subscription.id, request.quota_type)
    
    # Déterminer la limite
    if request.quota_type == "profile_views":
        limit = plan.max_profile_views
    else:
        limit = None  # Autres types de quotas à définir
    
    used = quota.used if quota else 0
    
    # Vérifier si le quota est disponible
    if limit is None:
        # Illimité
        allowed = True
        remaining = None
    else:
        remaining = limit - used
        allowed = remaining > 0
    
    return QuotaCheckResponse(
        allowed=allowed,
        used=used,
        limit=limit,
        remaining=remaining,
        message=None if allowed else f"Quota exceeded. Limit: {limit}, Used: {used}",
    )


@router.post("/use", status_code=status.HTTP_200_OK)
async def use_quota(
    request: QuotaUsageRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Enregistre l'utilisation d'un quota (décrémente le compteur)
    
    - **company_id**: ID de l'entreprise
    - **quota_type**: Type de quota
    - **amount**: Quantité à consommer (défaut: 1)
    """
    subscription_repo = SubscriptionRepository(session)
    subscription = await subscription_repo.get_by_company_id(request.company_id)
    
    if not subscription:
        raise SubscriptionNotFoundError(f"company_{request.company_id}")
    
    # Vérifier le quota avant d'utiliser
    quota_repo = QuotaRepository(session)
    quota = await quota_repo.get_current_quota(subscription.id, request.quota_type)
    
    # Récupérer le plan pour connaître la limite
    plan_repo = PlanRepository(session)
    plan = await plan_repo.get_by_id(subscription.plan_id)
    
    if request.quota_type == "profile_views":
        limit = plan.max_profile_views if plan else None
    else:
        limit = None
    
    current_used = quota.used if quota else 0
    
    # Vérifier si le quota est disponible
    if limit is not None and (current_used + request.amount) > limit:
        raise QuotaExceededError(
            f"Quota exceeded. Limit: {limit}, Current: {current_used}, Requested: {request.amount}"
        )
    
    # Décrémenter le quota
    await quota_repo.create_or_update_quota(
        subscription_id=subscription.id,
        quota_type=request.quota_type,
        amount=request.amount,
        limit=limit,
    )
    
    return {
        "message": "Quota used successfully",
        "used": current_used + request.amount,
        "limit": limit,
        "remaining": limit - (current_used + request.amount) if limit else None,
    }


@router.post("/check-and-use", response_model=QuotaCheckAndUseResponse, status_code=status.HTTP_200_OK)
async def check_and_use_quota(
    request: QuotaCheckRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Vérifie et utilise un quota en une seule opération atomique
    
    Cet endpoint est appelé par le service Recherche chaque fois qu'un recruteur
    veut voir un profil complet.
    
    Logique :
    - Si le plan est 'FREEMIUM' et views_remaining > 0, décrémente de 1
    - Si views_remaining = 0, retourne une erreur 403 'Quota atteint'
    - Si le plan est 'PRO' ou 'ENTERPRISE', autorise sans décrémenter (illimité)
    
    - **company_id**: ID de l'entreprise
    - **quota_type**: Type de quota (défaut: "profile_views")
    """
    from app.domain.models import PlanType
    
    subscription_repo = SubscriptionRepository(session)
    subscription = await subscription_repo.get_by_company_id(request.company_id)
    
    if not subscription:
        raise SubscriptionNotFoundError(f"company_{request.company_id}")
    
    # Récupérer le plan
    plan_repo = PlanRepository(session)
    plan = await plan_repo.get_by_id(subscription.plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Si le plan est PRO ou ENTERPRISE, autoriser sans décrémenter (illimité)
    if plan.plan_type in [PlanType.PRO, PlanType.ENTERPRISE]:
        return QuotaCheckAndUseResponse(
            allowed=True,
            used=0,
            limit=None,
            remaining=None,
            message=f"Unlimited quota for {plan.plan_type.value} plan",
            company_id=request.company_id,
            views_remaining=None,
            reset_date=None
        )
    
    # Pour FREEMIUM, vérifier et décrémenter le quota
    if plan.plan_type == PlanType.FREEMIUM:
        quota_repo = QuotaRepository(session)
        quota = await quota_repo.get_current_quota(subscription.id, request.quota_type)
        
        # Déterminer la limite
        if request.quota_type == "profile_views":
            limit = plan.max_profile_views
        else:
            limit = None
        
        # Si le quota n'existe pas encore, le créer avec used=0
        if not quota:
            # Créer le quota initial pour la période actuelle
            quota = await quota_repo.create_or_update_quota(
                subscription_id=subscription.id,
                quota_type=request.quota_type,
                amount=0,  # Initialiser à 0
                limit=limit,
            )
        
        current_used = quota.used
        views_remaining = (limit - current_used) if limit else None
        
        # Vérifier si le quota est disponible
        if limit is None:
            # Illimité (ne devrait pas arriver pour FREEMIUM)
            allowed = True
        else:
            allowed = views_remaining > 0
        
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Quota atteint. Limite: {limit}, Utilisé: {current_used}, Restant: 0"
            )
        
        # Décrémenter le quota de 1
        await quota_repo.create_or_update_quota(
            subscription_id=subscription.id,
            quota_type=request.quota_type,
            amount=1,  # Décrémenter de 1
            limit=limit,
        )
        
        # Recalculer les valeurs après décrémentation
        new_used = current_used + 1
        new_remaining = limit - new_used
        
        # Récupérer la date de réinitialisation (fin de période)
        reset_date = quota.period_end
        
        return QuotaCheckAndUseResponse(
            allowed=True,
            used=new_used,
            limit=limit,
            remaining=new_remaining,
            message=f"Quota used successfully. Remaining: {new_remaining}",
            company_id=request.company_id,
            views_remaining=new_remaining,
            reset_date=reset_date
        )
    
    # Plan non reconnu
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown plan type: {plan.plan_type}"
    )

