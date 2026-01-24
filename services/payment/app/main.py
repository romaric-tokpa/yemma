"""
Payment Service - Point d'entrée principal
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import payments, subscriptions, plans, webhooks, quotas, invoices, stats
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.infrastructure.database import init_db

app = FastAPI(
    title="Payment Service",
    description="Service de gestion des paiements et abonnements avec Stripe",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
setup_exception_handlers(app)

# Routers
app.include_router(plans.router, prefix="/api/v1/plans", tags=["Plans"])
app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["Subscriptions"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["Webhooks"])
app.include_router(quotas.router, prefix="/api/v1/quotas", tags=["Quotas"])
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["Invoices"])
app.include_router(stats.router, prefix="/api/v1/payments/stats", tags=["Stats"])


@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage"""
    await init_db()
    # Créer les plans par défaut s'ils n'existent pas
    from app.infrastructure.seed import seed_default_plans
    await seed_default_plans()


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "payment-service",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Payment Service API",
        "version": "1.0.0",
        "docs": "/docs",
    }

