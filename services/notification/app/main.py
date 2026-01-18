"""
Notification Service - Point d'entrée principal
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import notifications, health, triggers
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.infrastructure.database import init_db

app = FastAPI(
    title="Notification Service",
    description="Service de notification asynchrone avec envoi d'emails",
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
app.include_router(health.router, tags=["Health"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(triggers.router, prefix="/api/v1/triggers", tags=["Triggers"])


@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage"""
    await init_db()


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Notification Service API",
        "version": "1.0.0",
        "docs": "/docs",
    }


