"""
Gestion globale des exceptions
"""
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class PaymentError(Exception):
    """Exception de base pour les erreurs de paiement"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class SubscriptionNotFoundError(PaymentError):
    """Abonnement non trouvé"""
    def __init__(self, subscription_id: str):
        super().__init__(f"Subscription with id {subscription_id} not found", status.HTTP_404_NOT_FOUND)


class PlanNotFoundError(PaymentError):
    """Plan non trouvé"""
    def __init__(self, plan_id: str):
        super().__init__(f"Plan with id {plan_id} not found", status.HTTP_404_NOT_FOUND)


class QuotaExceededError(PaymentError):
    """Quota dépassé"""
    def __init__(self, message: str = "Quota exceeded"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class StripeError(PaymentError):
    """Erreur Stripe"""
    def __init__(self, message: str = "Stripe error"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


async def payment_error_handler(request: Request, exc: PaymentError):
    """Handler pour les erreurs de paiement"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "path": str(request.url),
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handler pour les exceptions HTTP standard"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "path": str(request.url),
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler pour les erreurs de validation Pydantic"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": "Validation error",
            "details": {"validation_errors": errors},
            "path": str(request.url),
        }
    )


def setup_exception_handlers(app: FastAPI):
    """Configure tous les handlers d'exceptions"""
    app.add_exception_handler(PaymentError, payment_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

