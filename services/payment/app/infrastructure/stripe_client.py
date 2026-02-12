"""
Client Stripe
"""
import stripe
from typing import Optional, Dict, Any

from app.core.config import settings
from app.core.exceptions import StripeError

# Initialiser Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeClient:
    """Client pour interagir avec Stripe"""
    
    @staticmethod
    def create_checkout_session(
        company_id: int,
        plan_id: int,
        price_id: str,
        billing_period: str = "month",
        trial_days: int = 0
    ) -> Dict[str, Any]:
        """
        Crée une session de checkout Stripe
        
        L'utilisateur renseigne ses coordonnées bancaires pour la facturation automatique.
        En cas d'essai gratuit, aucun prélèvement n'est effectué avant la fin de la période d'essai.
        
        Args:
            company_id: ID de l'entreprise
            plan_id: ID du plan
            price_id: Stripe Price ID
            billing_period: monthly ou yearly
            trial_days: Nombre de jours d'essai gratuit (0 = pas d'essai)
        """
        try:
            subscription_data = {
                "metadata": {
                    "company_id": str(company_id),
                    "plan_id": str(plan_id),
                }
            }
            if trial_days and trial_days > 0:
                subscription_data["trial_period_days"] = trial_days
            
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price": price_id,
                    "quantity": 1,
                }],
                mode="subscription",
                success_url=f"{settings.FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/payment/cancel",
                metadata={
                    "company_id": str(company_id),
                    "plan_id": str(plan_id),
                    "billing_period": billing_period,
                },
                subscription_data=subscription_data,
            )
            return session
        except stripe.error.StripeError as e:
            raise StripeError(f"Failed to create checkout session: {str(e)}")
    
    @staticmethod
    def get_checkout_session(session_id: str) -> Dict[str, Any]:
        """Récupère une session de checkout"""
        try:
            return stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError as e:
            raise StripeError(f"Failed to retrieve checkout session: {str(e)}")
    
    @staticmethod
    def get_subscription(subscription_id: str) -> Dict[str, Any]:
        """Récupère un abonnement Stripe"""
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.StripeError as e:
            raise StripeError(f"Failed to retrieve subscription: {str(e)}")
    
    @staticmethod
    def get_customer(customer_id: str) -> Dict[str, Any]:
        """Récupère un client Stripe"""
        try:
            return stripe.Customer.retrieve(customer_id)
        except stripe.error.StripeError as e:
            raise StripeError(f"Failed to retrieve customer: {str(e)}")
    
    @staticmethod
    def cancel_subscription(subscription_id: str, at_period_end: bool = True) -> Dict[str, Any]:
        """Annule un abonnement"""
        try:
            if at_period_end:
                return stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                return stripe.Subscription.delete(subscription_id)
        except stripe.error.StripeError as e:
            raise StripeError(f"Failed to cancel subscription: {str(e)}")
    
    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str) -> Dict[str, Any]:
        """Vérifie la signature d'un webhook Stripe"""
        try:
            return stripe.Webhook.construct_event(
                payload,
                signature,
                settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            raise StripeError(f"Invalid payload: {str(e)}")
        except stripe.error.SignatureVerificationError as e:
            raise StripeError(f"Invalid signature: {str(e)}")

