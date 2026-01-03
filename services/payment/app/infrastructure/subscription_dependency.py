"""
Dependency FastAPI pour vérifier les abonnements
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import PlanType, SubscriptionStatus
from app.infrastructure.database import get_session
from app.infrastructure.repositories import SubscriptionRepository, PlanRepository


async def require_subscription(
    company_id: int,
    plan: Optional[PlanType] = None,
    session: AsyncSession = Depends(get_session)
):
    """
    Dependency FastAPI pour vérifier qu'une entreprise a un abonnement actif
    
    Args:
        company_id: ID de l'entreprise
        plan: Plan minimum requis (FREEMIUM, PRO, ENTERPRISE). Si None, vérifie juste qu'un abonnement actif existe
        session: Session de base de données
    
    Returns:
        Subscription: L'abonnement actif
    
    Raises:
        HTTPException: Si aucun abonnement actif ou si le plan n'est pas suffisant
    
    Usage:
        @router.get("/candidates")
        async def search_candidates(
            company_id: int,
            subscription = Depends(lambda cid: require_subscription(cid, plan=PlanType.PRO))
        ):
            ...
    """
    # Récupérer l'abonnement actif de l'entreprise
    subscription_repo = SubscriptionRepository(session)
    subscription = await subscription_repo.get_active_by_company_id(company_id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active subscription found. Please subscribe to access this feature."
        )
    
    # Vérifier le statut de l'abonnement
    if subscription.status not in [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Subscription is {subscription.status}. Please renew your subscription."
        )
    
    # Si un plan minimum est requis, vérifier le plan
    if plan is not None:
        plan_repo = PlanRepository(session)
        current_plan = await plan_repo.get_by_id(subscription.plan_id)
        
        if not current_plan:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Plan not found"
            )
        
        # Vérifier que le plan actuel est suffisant
        plan_hierarchy = {
            PlanType.FREEMIUM: 1,
            PlanType.PRO: 2,
            PlanType.ENTERPRISE: 3,
        }
        
        required_level = plan_hierarchy.get(plan, 0)
        current_level = plan_hierarchy.get(current_plan.plan_type, 0)
        
        if current_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires a {plan.value} plan or higher. Your current plan is {current_plan.plan_type.value}."
            )
    
    return subscription


def require_subscription_plan(plan: PlanType):
    """
    Factory function pour créer une dependency avec un plan spécifique
    
    Usage:
        @router.get("/candidates")
        async def search_candidates(
            company_id: int,
            subscription = Depends(require_subscription_plan(PlanType.PRO))
        ):
            ...
    """
    async def dependency(
        company_id: int,
        session: AsyncSession = Depends(get_session)
    ):
        return await require_subscription(company_id, plan=plan, session=session)
    
    return dependency

