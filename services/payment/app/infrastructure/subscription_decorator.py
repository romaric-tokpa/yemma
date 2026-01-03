"""
Décorateur pour protéger les endpoints avec vérification d'abonnement
"""
from functools import wraps
from typing import Callable, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import PlanType, SubscriptionStatus
from app.infrastructure.database import get_session
from app.infrastructure.repositories import SubscriptionRepository, PlanRepository


def require_subscription(plan: Optional[PlanType] = None):
    """
    Décorateur pour protéger un endpoint avec vérification d'abonnement
    
    Ce décorateur doit être utilisé avec une dependency FastAPI qui fournit company_id.
    
    Args:
        plan: Plan minimum requis (FREEMIUM, PRO, ENTERPRISE)
              Si None, vérifie juste qu'un abonnement actif existe
    
    Usage avec get_current_company:
        from services.company.app.infrastructure.company_middleware import get_current_company
        
        @router.get("/candidates")
        @require_subscription(plan=PlanType.PRO)
        async def search_candidates(
            company = Depends(get_current_company),
            session: AsyncSession = Depends(get_session)
        ):
            # L'abonnement est vérifié automatiquement
            ...
    
    Note: Il est recommandé d'utiliser la dependency require_subscription_plan
    de subscription_dependency.py pour une meilleure intégration avec FastAPI.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extraire company_id des kwargs
            company_id = None
            
            # Chercher company_id dans les kwargs
            if 'company_id' in kwargs:
                company_id = kwargs['company_id']
            # Chercher une company depuis get_current_company
            elif 'company' in kwargs:
                company_id = kwargs['company'].id
            elif 'current_company' in kwargs:
                company_id = kwargs['current_company'].id
            
            if company_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="company_id is required. Use get_current_company dependency."
                )
            
            # Récupérer la session
            session = kwargs.get('session')
            if not session:
                from app.infrastructure.database import AsyncSessionLocal
                session = AsyncSessionLocal()
                should_close = True
            else:
                should_close = False
            
            try:
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
                
                # Ajouter l'abonnement aux kwargs pour utilisation dans la fonction
                kwargs['subscription'] = subscription
                
                # Appeler la fonction originale
                return await func(*args, **kwargs)
            
            finally:
                if should_close and session:
                    await session.close()
        
        return wrapper
    return decorator

