"""
Modèles du domaine métier (SQLModel)
"""
from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship


class PlanType(str, Enum):
    """Types de plans"""
    FREEMIUM = "FREEMIUM"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"


class SubscriptionStatus(str, Enum):
    """Statut de l'abonnement"""
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    UNPAID = "unpaid"
    TRIALING = "trialing"


class PaymentStatus(str, Enum):
    """Statut du paiement"""
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"


class Plan(SQLModel, table=True):
    """Modèle Plan"""
    __tablename__ = "plans"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=50, description="Nom du plan")
    plan_type: PlanType = Field(description="Type de plan")
    description: Optional[str] = Field(default=None, max_length=500, description="Description du plan")
    price_monthly: float = Field(default=0.0, description="Prix mensuel en EUR")
    price_yearly: Optional[float] = Field(default=None, description="Prix annuel en EUR")
    
    # Quotas et limites
    max_profile_views: Optional[int] = Field(default=None, description="Nombre max de consultations de profils (None = illimité)")
    unlimited_search: bool = Field(default=False, description="Recherche illimitée")
    document_access: bool = Field(default=False, description="Accès aux documents")
    multi_accounts: bool = Field(default=False, description="Multi-comptes recruteurs")
    
    # Stripe
    stripe_price_id_monthly: Optional[str] = Field(default=None, max_length=255, description="Stripe Price ID mensuel")
    stripe_price_id_yearly: Optional[str] = Field(default=None, max_length=255, description="Stripe Price ID annuel")
    
    is_active: bool = Field(default=True, description="Plan actif")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relations
    subscriptions: list["Subscription"] = Relationship(back_populates="plan")


class Subscription(SQLModel, table=True):
    """Modèle Subscription"""
    __tablename__ = "subscriptions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(index=True, description="ID de l'entreprise (référence externe au service company)")
    plan_id: int = Field(foreign_key="plans.id", index=True, description="ID du plan")
    status: SubscriptionStatus = Field(default=SubscriptionStatus.ACTIVE, description="Statut de l'abonnement")
    
    # Stripe
    stripe_subscription_id: Optional[str] = Field(default=None, unique=True, index=True, max_length=255, description="Stripe Subscription ID")
    stripe_customer_id: Optional[str] = Field(default=None, index=True, max_length=255, description="Stripe Customer ID")
    
    # Dates
    start_date: datetime = Field(default_factory=datetime.utcnow, description="Date de début")
    end_date: Optional[datetime] = Field(default=None, description="Date de fin")
    current_period_start: Optional[datetime] = Field(default=None, description="Début de la période courante")
    current_period_end: Optional[datetime] = Field(default=None, description="Fin de la période courante")
    cancel_at_period_end: bool = Field(default=False, description="Annulation à la fin de la période")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relations
    plan: Plan = Relationship(back_populates="subscriptions")
    payments: list["Payment"] = Relationship(back_populates="subscription")
    quotas: list["Quota"] = Relationship(back_populates="subscription")


class Payment(SQLModel, table=True):
    """Modèle Payment"""
    __tablename__ = "payments"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    subscription_id: int = Field(foreign_key="subscriptions.id", index=True, description="ID de l'abonnement")
    amount: float = Field(description="Montant en EUR")
    currency: str = Field(default="eur", max_length=3, description="Devise")
    status: PaymentStatus = Field(default=PaymentStatus.PENDING, description="Statut du paiement")
    
    # Stripe
    stripe_payment_intent_id: Optional[str] = Field(default=None, unique=True, index=True, max_length=255, description="Stripe Payment Intent ID")
    stripe_checkout_session_id: Optional[str] = Field(default=None, index=True, max_length=255, description="Stripe Checkout Session ID")
    
    payment_date: Optional[datetime] = Field(default=None, description="Date de paiement")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relations
    subscription: Subscription = Relationship(back_populates="payments")
    invoice: Optional["Invoice"] = Relationship(back_populates="payment", sa_relationship_kwargs={"uselist": False})


class Invoice(SQLModel, table=True):
    """Modèle Invoice"""
    __tablename__ = "invoices"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    payment_id: int = Field(foreign_key="payments.id", unique=True, index=True, description="ID du paiement")
    invoice_number: str = Field(unique=True, index=True, max_length=50, description="Numéro de facture")
    company_id: int = Field(index=True, description="ID de l'entreprise")
    
    amount: float = Field(description="Montant en EUR")
    tax_amount: float = Field(default=0.0, description="Montant de TVA")
    total_amount: float = Field(description="Montant total")
    
    # Fichier PDF
    pdf_url: Optional[str] = Field(default=None, max_length=500, description="URL du PDF de facture")
    
    invoice_date: datetime = Field(default_factory=datetime.utcnow, description="Date de facture")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relations
    payment: Payment = Relationship(back_populates="invoice")


class Quota(SQLModel, table=True):
    """Modèle Quota - Suivi des quotas d'utilisation"""
    __tablename__ = "quotas"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    subscription_id: int = Field(foreign_key="subscriptions.id", index=True, description="ID de l'abonnement")
    quota_type: str = Field(index=True, max_length=50, description="Type de quota (profile_views, etc.)")
    limit: Optional[int] = Field(default=None, description="Limite (None = illimité)")
    used: int = Field(default=0, description="Utilisé")
    period_start: datetime = Field(index=True, description="Début de la période")
    period_end: datetime = Field(index=True, description="Fin de la période")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relations
    subscription: Subscription = Relationship(back_populates="quotas")

