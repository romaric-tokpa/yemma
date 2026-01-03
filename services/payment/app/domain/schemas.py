"""
Schémas Pydantic pour la validation des données
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.domain.models import PlanType, SubscriptionStatus, PaymentStatus


# ============================================
# Plan Schemas
# ============================================

class PlanResponse(BaseModel):
    """Schéma de réponse pour Plan"""
    id: int
    name: str
    plan_type: str
    description: Optional[str] = None
    price_monthly: float
    price_yearly: Optional[float] = None
    max_profile_views: Optional[int] = None
    unlimited_search: bool
    document_access: bool
    multi_accounts: bool
    is_active: bool

    class Config:
        from_attributes = True


# ============================================
# Subscription Schemas
# ============================================

class SubscriptionCreate(BaseModel):
    """Schéma pour la création d'un abonnement"""
    company_id: int
    plan_id: int


class SubscriptionResponse(BaseModel):
    """Schéma de réponse pour Subscription"""
    id: int
    company_id: int
    plan_id: int
    status: str
    start_date: datetime
    end_date: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool

    class Config:
        from_attributes = True


class SubscriptionDetailResponse(SubscriptionResponse):
    """Schéma de réponse détaillé pour Subscription"""
    plan: PlanResponse
    quota_used: int = 0
    quota_limit: Optional[int] = None


# ============================================
# Payment Schemas
# ============================================

class CheckoutSessionCreate(BaseModel):
    """Schéma pour créer une session de checkout"""
    company_id: int
    plan_id: int
    billing_period: str = Field("monthly", pattern="^(monthly|yearly)$", description="Période de facturation")


class CheckoutSessionResponse(BaseModel):
    """Schéma de réponse pour une session de checkout"""
    session_id: str
    url: str
    company_id: int
    plan_id: int


class PaymentResponse(BaseModel):
    """Schéma de réponse pour Payment"""
    id: int
    subscription_id: int
    amount: float
    currency: str
    status: str
    payment_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Invoice Schemas
# ============================================

class InvoiceResponse(BaseModel):
    """Schéma de réponse pour Invoice"""
    id: int
    invoice_number: str
    company_id: int
    amount: float
    tax_amount: float
    total_amount: float
    pdf_url: Optional[str] = None
    invoice_date: datetime

    class Config:
        from_attributes = True


# ============================================
# Quota Schemas
# ============================================

class QuotaCheckRequest(BaseModel):
    """Schéma pour vérifier un quota"""
    company_id: int
    quota_type: str = Field(default="profile_views", description="Type de quota")


class QuotaCheckResponse(BaseModel):
    """Schéma de réponse pour vérification de quota"""
    allowed: bool
    used: int
    limit: Optional[int] = None
    remaining: Optional[int] = None
    message: Optional[str] = None


class QuotaUsageRequest(BaseModel):
    """Schéma pour enregistrer l'utilisation d'un quota"""
    company_id: int
    quota_type: str = Field(default="profile_views")
    amount: int = Field(default=1, ge=1, description="Quantité à consommer")


class QuotaCheckAndUseResponse(BaseModel):
    """Schéma de réponse pour check-and-use"""
    allowed: bool
    used: int
    limit: Optional[int] = None
    remaining: Optional[int] = None
    message: Optional[str] = None
    company_id: Optional[int] = None
    views_remaining: Optional[int] = None
    reset_date: Optional[datetime] = None

