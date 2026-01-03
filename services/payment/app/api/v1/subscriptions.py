"""
Endpoints de gestion des abonnements
"""
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.schemas import SubscriptionResponse, SubscriptionDetailResponse
from app.core.exceptions import SubscriptionNotFoundError
from app.infrastructure.database import get_session
from app.infrastructure.repositories import SubscriptionRepository, PlanRepository, QuotaRepository

router = APIRouter()


@router.get("/company/{company_id}", response_model=SubscriptionDetailResponse)
async def get_company_subscription(
    company_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère l'abonnement actif d'une entreprise
    """
    subscription_repo = SubscriptionRepository(session)
    subscription = await subscription_repo.get_by_company_id(company_id)
    
    if not subscription:
        raise SubscriptionNotFoundError(f"company_{company_id}")
    
    # Récupérer le plan
    plan_repo = PlanRepository(session)
    plan = await plan_repo.get_by_id(subscription.plan_id)
    
    # Récupérer le quota actuel
    quota_repo = QuotaRepository(session)
    quota = await quota_repo.get_current_quota(subscription.id, "profile_views")
    
    response = SubscriptionDetailResponse.model_validate(subscription)
    response.plan = plan
    response.quota_used = quota.used if quota else 0
    response.quota_limit = quota.limit if quota else plan.max_profile_views if plan else None
    
    return response

