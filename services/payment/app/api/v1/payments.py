"""
Endpoints de gestion des paiements
"""
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.schemas import (
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    PaymentResponse,
)
from app.core.config import settings
from app.core.exceptions import PlanNotFoundError
from app.infrastructure.database import get_session
from app.infrastructure.repositories import PlanRepository
from app.infrastructure.stripe_client import StripeClient

router = APIRouter()


@router.post("/checkout", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/create-checkout-session", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_checkout_session(
    checkout_data: CheckoutSessionCreate,
    session: AsyncSession = Depends(get_session)
):
    """
    Crée une session de checkout Stripe pour un abonnement
    
    Redirige l'entreprise vers Stripe pour payer.
    
    - **company_id**: ID de l'entreprise
    - **plan_id**: ID du plan
    - **billing_period**: monthly ou yearly
    """
    # Récupérer le plan
    plan_repo = PlanRepository(session)
    plan = await plan_repo.get_by_id(checkout_data.plan_id)
    
    if not plan:
        raise PlanNotFoundError(str(checkout_data.plan_id))
    
    # Déterminer le price_id selon la période
    if checkout_data.billing_period == "yearly":
        price_id = plan.stripe_price_id_yearly
        if not price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yearly pricing not available for this plan"
            )
    else:
        price_id = plan.stripe_price_id_monthly
        if not price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Monthly pricing not configured for this plan"
            )
    
    # Créer la session Stripe (avec essai gratuit si configuré)
    stripe_client = StripeClient()
    checkout_session = stripe_client.create_checkout_session(
        company_id=checkout_data.company_id,
        plan_id=checkout_data.plan_id,
        price_id=price_id,
        billing_period=checkout_data.billing_period,
        trial_days=settings.TRIAL_DAYS,
    )
    
    return CheckoutSessionResponse(
        session_id=checkout_session.id,
        url=checkout_session.url,
        company_id=checkout_data.company_id,
        plan_id=checkout_data.plan_id,
    )

