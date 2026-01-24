"""
Repositories pour l'accès aux données
"""
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.domain.models import Plan, Subscription, Payment, Invoice, Quota


class PlanRepository:
    """Repository pour les opérations sur les plans"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, plan_id: int) -> Optional[Plan]:
        """Récupère un plan par ID"""
        result = await self.session.get(Plan, plan_id)
        return result
    
    async def get_by_type(self, plan_type: str) -> Optional[Plan]:
        """Récupère un plan par type"""
        statement = select(Plan).where(
            Plan.plan_type == plan_type,
            Plan.is_active == True
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_all_active(self) -> List[Plan]:
        """Récupère tous les plans actifs"""
        statement = select(Plan).where(Plan.is_active == True).order_by(
            Plan.price_monthly.asc(),
            Plan.name.asc()
        )
        result = await self.session.execute(statement)
        plans = list(result.scalars().all())
        print(f"📋 Plans actifs récupérés depuis la DB: {[p.name for p in plans]}")
        return plans
    
    async def create(self, plan: Plan) -> Plan:
        """Crée un nouveau plan"""
        self.session.add(plan)
        await self.session.commit()
        await self.session.refresh(plan)
        return plan


class SubscriptionRepository:
    """Repository pour les opérations sur les abonnements"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, subscription_id: int) -> Optional[Subscription]:
        """Récupère un abonnement par ID"""
        result = await self.session.get(Subscription, subscription_id)
        return result
    
    async def get_by_company_id(self, company_id: int) -> Optional[Subscription]:
        """Récupère l'abonnement actif d'une entreprise"""
        statement = select(Subscription).where(
            Subscription.company_id == company_id,
            Subscription.status == "active"
        ).order_by(Subscription.created_at.desc())
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_active_by_company_id(self, company_id: int) -> Optional[Subscription]:
        """Récupère l'abonnement actif ou en trial d'une entreprise"""
        from app.domain.models import SubscriptionStatus
        statement = select(Subscription).where(
            Subscription.company_id == company_id,
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING])
        ).order_by(Subscription.created_at.desc())
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_by_stripe_subscription_id(self, stripe_subscription_id: str) -> Optional[Subscription]:
        """Récupère un abonnement par Stripe Subscription ID"""
        statement = select(Subscription).where(
            Subscription.stripe_subscription_id == stripe_subscription_id
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def create(self, subscription: Subscription) -> Subscription:
        """Crée un nouvel abonnement"""
        self.session.add(subscription)
        await self.session.commit()
        await self.session.refresh(subscription)
        return subscription
    
    async def update(self, subscription: Subscription) -> Subscription:
        """Met à jour un abonnement"""
        subscription.updated_at = datetime.utcnow()
        self.session.add(subscription)
        await self.session.commit()
        await self.session.refresh(subscription)
        return subscription


class PaymentRepository:
    """Repository pour les opérations sur les paiements"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_stripe_payment_intent_id(self, payment_intent_id: str) -> Optional[Payment]:
        """Récupère un paiement par Stripe Payment Intent ID"""
        statement = select(Payment).where(
            Payment.stripe_payment_intent_id == payment_intent_id
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_by_checkout_session_id(self, checkout_session_id: str) -> Optional[Payment]:
        """Récupère un paiement par Stripe Checkout Session ID"""
        statement = select(Payment).where(
            Payment.stripe_checkout_session_id == checkout_session_id
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def create(self, payment: Payment) -> Payment:
        """Crée un nouveau paiement"""
        self.session.add(payment)
        await self.session.commit()
        await self.session.refresh(payment)
        return payment
    
    async def update(self, payment: Payment) -> Payment:
        """Met à jour un paiement"""
        payment.updated_at = datetime.utcnow()
        self.session.add(payment)
        await self.session.commit()
        await self.session.refresh(payment)
        return payment


class QuotaRepository:
    """Repository pour les opérations sur les quotas"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_current_quota(
        self,
        subscription_id: int,
        quota_type: str,
        period_start: Optional[datetime] = None,
        period_end: Optional[datetime] = None
    ) -> Optional[Quota]:
        """Récupère le quota actuel pour une période"""
        if not period_start or not period_end:
            # Période mensuelle par défaut
            now = datetime.utcnow()
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if period_start.month == 12:
                period_end = period_start.replace(year=period_start.year + 1, month=1)
            else:
                period_end = period_start.replace(month=period_start.month + 1)
        
        statement = select(Quota).where(
            Quota.subscription_id == subscription_id,
            Quota.quota_type == quota_type,
            Quota.period_start == period_start,
            Quota.period_end == period_end
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def create_or_update_quota(
        self,
        subscription_id: int,
        quota_type: str,
        amount: int,
        limit: Optional[int] = None,
        period_start: Optional[datetime] = None,
        period_end: Optional[datetime] = None
    ) -> Quota:
        """Crée ou met à jour un quota"""
        quota = await self.get_current_quota(subscription_id, quota_type, period_start, period_end)
        
        if quota:
            quota.used += amount
            quota.updated_at = datetime.utcnow()
        else:
            if not period_start or not period_end:
                now = datetime.utcnow()
                period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if period_start.month == 12:
                    period_end = period_start.replace(year=period_start.year + 1, month=1)
                else:
                    period_end = period_start.replace(month=period_start.month + 1)
            
            quota = Quota(
                subscription_id=subscription_id,
                quota_type=quota_type,
                limit=limit,
                used=amount,
                period_start=period_start,
                period_end=period_end,
            )
            self.session.add(quota)
        
        await self.session.commit()
        await self.session.refresh(quota)
        return quota


class InvoiceRepository:
    """Repository pour les opérations sur les factures"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, invoice_id: int) -> Optional[Invoice]:
        """Récupère une facture par ID"""
        result = await self.session.get(Invoice, invoice_id)
        return result
    
    async def get_by_company_id(self, company_id: int) -> List[Invoice]:
        """Récupère toutes les factures d'une entreprise"""
        statement = select(Invoice).where(
            Invoice.company_id == company_id
        ).order_by(Invoice.invoice_date.desc())
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    async def get_by_payment_id(self, payment_id: int) -> Optional[Invoice]:
        """Récupère une facture par payment_id"""
        statement = select(Invoice).where(Invoice.payment_id == payment_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def create(self, invoice: Invoice) -> Invoice:
        """Crée une nouvelle facture"""
        self.session.add(invoice)
        await self.session.commit()
        await self.session.refresh(invoice)
        return invoice

