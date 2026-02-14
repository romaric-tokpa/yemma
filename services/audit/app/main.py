"""
Audit Service - Point d'entrée principal
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import access_logs, health
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.infrastructure.database import init_db

app = FastAPI(
    title="Audit Service",
    description="Service de logs et audit pour le respect du RGPD",
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
app.include_router(access_logs.router, prefix="/api/v1/audit", tags=["Audit"])


@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage"""
    await init_db()


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Audit Service API",
        "version": "1.0.0",
        "docs": "/docs",
    }


