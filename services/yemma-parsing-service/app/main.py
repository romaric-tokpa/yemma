"""
Yemma Parsing Service - Point d'entrée FastAPI

Microservice de parsing CV via HRFlow.ai
Retourne les données au format Yemma (profil, expériences, formations, compétences)
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.api.v1.parsing import router as parsing_router

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hooks pour l'application."""
    logger.info(f"[Startup] {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"[Startup] HRFlow API URL: {settings.HRFLOW_API_URL}")
    yield
    logger.info("[Shutdown] Service stopping...")


# Application FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## Yemma Parsing Service

    Microservice de parsing de CV via HRFlow.ai.

    ### Fonctionnalités

    - **Parsing synchrone** : Upload et parsing immédiat du CV
    - **Parsing asynchrone** : Traitement en tâche de fond via Celery
    - **Format Yemma** : Données alignées sur le dashboard candidat

    ### Données extraites

    - **Profil** : Nom, email, téléphone, titre, résumé professionnel
    - **Expériences** : Entreprise, poste, dates, description, réalisations
    - **Formations** : Diplôme, établissement, année, niveau
    - **Compétences** : Nom, type (technique/soft/outil), niveau
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routes
app.include_router(parsing_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health():
    """Health check global du service."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint avec informations du service."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handler global pour les exceptions non gérées."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
