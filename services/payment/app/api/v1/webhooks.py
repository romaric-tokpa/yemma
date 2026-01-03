"""
Webhooks Stripe
"""
from fastapi import APIRouter, Request, Header, status, HTTPException
from typing import Optional
import json

from app.core.config import settings
from app.core.exceptions import StripeError
from app.infrastructure.stripe_client import StripeClient
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.repositories import (
    SubscriptionRepository,
    PaymentRepository,
    PlanRepository,
    QuotaRepository,
)
from app.domain.models import Subscription, Payment, SubscriptionStatus, PaymentStatus, Invoice, Quota
from datetime import datetime
import httpx

router = APIRouter()


@router.post("/stripe", status_code=status.HTTP_200_OK)
@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature")
):
    """
    Webhook Stripe pour écouter les événements
    
    Écoute les événements Stripe pour mettre à jour le statut en base de données.
    
    Événements gérés :
    - checkout.session.completed : Créer l'abonnement
    - invoice.paid : Mettre à jour le paiement et générer la facture
    - customer.subscription.updated : Mettre à jour l'abonnement
    - customer.subscription.deleted : Annuler l'abonnement
    """
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header"
        )
    
    # Lire le payload
    payload = await request.body()
    
    # Vérifier la signature
    stripe_client = StripeClient()
    try:
        event = stripe_client.verify_webhook_signature(payload, stripe_signature)
    except StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Traiter l'événement
    event_type = event["type"]
    event_data = event["data"]["object"]
    
    async with AsyncSessionLocal() as session:
        if event_type == "checkout.session.completed":
            await handle_checkout_completed(event_data, session)
        elif event_type == "invoice.paid":
            await handle_invoice_paid(event_data, session)
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(event_data, session)
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(event_data, session)
    
    return {"status": "success"}


async def handle_checkout_completed(session_data: dict, session):
    """Gère l'événement checkout.session.completed"""
    subscription_repo = SubscriptionRepository(session)
    plan_repo = PlanRepository(session)
    
    # Extraire les métadonnées
    metadata = session_data.get("metadata", {})
    company_id = int(metadata.get("company_id"))
    plan_id = int(metadata.get("plan_id"))
    
    # Récupérer le plan
    plan = await plan_repo.get_by_id(plan_id)
    if not plan:
        return
    
    # Récupérer l'abonnement Stripe
    stripe_subscription_id = session_data.get("subscription")
    if not stripe_subscription_id:
        return
    
    stripe_client = StripeClient()
    stripe_subscription = stripe_client.get_subscription(stripe_subscription_id)
    
    # Vérifier si l'abonnement existe déjà
    existing = await subscription_repo.get_by_stripe_subscription_id(stripe_subscription_id)
    
    if existing:
        # Mettre à jour l'abonnement existant
        existing.status = SubscriptionStatus.ACTIVE
        existing.current_period_start = datetime.fromtimestamp(
            stripe_subscription["current_period_start"]
        )
        existing.current_period_end = datetime.fromtimestamp(
            stripe_subscription["current_period_end"]
        )
        await subscription_repo.update(existing)
    else:
        # Créer un nouvel abonnement
        subscription = Subscription(
            company_id=company_id,
            plan_id=plan_id,
            status=SubscriptionStatus.ACTIVE,
            stripe_subscription_id=stripe_subscription_id,
            stripe_customer_id=stripe_subscription.get("customer"),
            current_period_start=datetime.fromtimestamp(
                stripe_subscription["current_period_start"]
            ),
            current_period_end=datetime.fromtimestamp(
                stripe_subscription["current_period_end"]
            ),
        )
        subscription = await subscription_repo.create(subscription)
        
        # Créer le quota initial
        quota_repo = QuotaRepository(session)
        await quota_repo.create_or_update_quota(
            subscription_id=subscription.id,
            quota_type="profile_views",
            amount=0,
            limit=plan.max_profile_views,
        )
        
        # Notifier le service company
        subscription_id_to_notify = subscription.id
    else:
        subscription_id_to_notify = existing.id
    
    # Notifier le service company
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.COMPANY_SERVICE_URL}/api/v1/companies/{company_id}/subscription-activated",
                json={"subscription_id": subscription_id_to_notify}
            )
    except Exception:
        pass  # Log l'erreur mais ne bloque pas


async def handle_invoice_paid(invoice_data: dict, session):
    """
    Gère l'événement invoice.paid
    
    Actions :
    1. Met à jour le paiement et génère la facture
    2. Met à jour le statut de l'abonnement
    3. Réinitialise les quotas mensuellement (nouvelle période)
    """
    payment_repo = PaymentRepository(session)
    subscription_repo = SubscriptionRepository(session)
    quota_repo = QuotaRepository(session)
    plan_repo = PlanRepository(session)
    
    stripe_subscription_id = invoice_data.get("subscription")
    if not stripe_subscription_id:
        return
    
    # Récupérer l'abonnement
    subscription = await subscription_repo.get_by_stripe_subscription_id(stripe_subscription_id)
    if not subscription:
        return
    
    # Vérifier si le paiement existe déjà
    payment_intent_id = invoice_data.get("payment_intent")
    if payment_intent_id:
        existing_payment = await payment_repo.get_by_stripe_payment_intent_id(payment_intent_id)
        
        if existing_payment:
            # Mettre à jour le paiement
            existing_payment.status = PaymentStatus.SUCCEEDED
            existing_payment.payment_date = datetime.utcnow()
            await payment_repo.update(existing_payment)
        else:
            # Créer un nouveau paiement
            amount = invoice_data.get("amount_paid", 0) / 100  # Stripe utilise les centimes
            payment = Payment(
                subscription_id=subscription.id,
                amount=amount,
                currency=invoice_data.get("currency", "eur"),
                status=PaymentStatus.SUCCEEDED,
                stripe_payment_intent_id=payment_intent_id,
                payment_date=datetime.utcnow(),
            )
            payment = await payment_repo.create(payment)
            
            # Générer la facture
            invoice_number = f"INV-{payment.id:06d}"
            invoice = Invoice(
                payment_id=payment.id,
                invoice_number=invoice_number,
                company_id=subscription.company_id,
                amount=amount,
                tax_amount=amount * 0.20,  # 20% TVA (à ajuster)
                total_amount=amount * 1.20,
            )
            session.add(invoice)
            await session.commit()
    
    # Mettre à jour l'abonnement
    subscription.status = SubscriptionStatus.ACTIVE
    
    # Mettre à jour les dates de période depuis Stripe
    stripe_client = StripeClient()
    stripe_subscription = stripe_client.get_subscription(stripe_subscription_id)
    if stripe_subscription:
        subscription.current_period_start = datetime.fromtimestamp(
            stripe_subscription["current_period_start"]
        )
        subscription.current_period_end = datetime.fromtimestamp(
            stripe_subscription["current_period_end"]
        )
    
    await subscription_repo.update(subscription)
    
    # ============================================
    # RÉINITIALISATION DES QUOTAS MENSUELLEMENT
    # ============================================
    # Récupérer le plan pour connaître les limites
    plan = await plan_repo.get_by_id(subscription.plan_id)
    if not plan:
        return
    
    # Calculer la nouvelle période (mois suivant)
    now = datetime.utcnow()
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if period_start.month == 12:
        period_end = period_start.replace(year=period_start.year + 1, month=1)
    else:
        period_end = period_start.replace(month=period_start.month + 1)
    
    # Réinitialiser le quota profile_views pour la nouvelle période
    # Si un quota existe déjà pour cette période, on le met à jour
    # Sinon, on en crée un nouveau avec used=0
    existing_quota = await quota_repo.get_current_quota(
        subscription.id,
        "profile_views",
        period_start,
        period_end
    )
    
    if existing_quota:
        # Réinitialiser le quota existant
        existing_quota.used = 0
        existing_quota.limit = plan.max_profile_views
        existing_quota.period_start = period_start
        existing_quota.period_end = period_end
        existing_quota.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(existing_quota)
    else:
        # Créer un nouveau quota pour la nouvelle période
        new_quota = Quota(
            subscription_id=subscription.id,
            quota_type="profile_views",
            limit=plan.max_profile_views,
            used=0,  # Réinitialisé à 0
            period_start=period_start,
            period_end=period_end,
        )
        session.add(new_quota)
        await session.commit()


async def handle_subscription_updated(subscription_data: dict, session):
    """Gère l'événement customer.subscription.updated"""
    subscription_repo = SubscriptionRepository(session)
    
    stripe_subscription_id = subscription_data.get("id")
    subscription = await subscription_repo.get_by_stripe_subscription_id(stripe_subscription_id)
    
    if subscription:
        subscription.current_period_start = datetime.fromtimestamp(
            subscription_data["current_period_start"]
        )
        subscription.current_period_end = datetime.fromtimestamp(
            subscription_data["current_period_end"]
        )
        subscription.cancel_at_period_end = subscription_data.get("cancel_at_period_end", False)
        
        # Mettre à jour le statut
        status_map = {
            "active": SubscriptionStatus.ACTIVE,
            "past_due": SubscriptionStatus.PAST_DUE,
            "unpaid": SubscriptionStatus.UNPAID,
            "trialing": SubscriptionStatus.TRIALING,
            "canceled": SubscriptionStatus.CANCELLED,
        }
        stripe_status = subscription_data.get("status")
        subscription.status = status_map.get(stripe_status, SubscriptionStatus.ACTIVE)
        
        await subscription_repo.update(subscription)


async def handle_subscription_deleted(subscription_data: dict, session):
    """Gère l'événement customer.subscription.deleted"""
    subscription_repo = SubscriptionRepository(session)
    
    stripe_subscription_id = subscription_data.get("id")
    subscription = await subscription_repo.get_by_stripe_subscription_id(stripe_subscription_id)
    
    if subscription:
        subscription.status = SubscriptionStatus.CANCELLED
        subscription.end_date = datetime.utcnow()
        await subscription_repo.update(subscription)

