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


def _debug_log(loc: str, msg: str, data: dict, hid: str):
    import json, time
    payload = {"location": loc, "message": msg, "data": data, "hypothesisId": hid, "timestamp": int(time.time() * 1000)}
    for url in ["http://host.docker.internal:7243/ingest/1bce2d70-be0c-458b-b590-abb89d1d3933", "http://127.0.0.1:7243/ingest/1bce2d70-be0c-458b-b590-abb89d1d3933"]:
        try:
            import urllib.request
            req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
            urllib.request.urlopen(req, timeout=1)
            return
        except Exception:
            continue

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handler global pour les exceptions non gérées."""
    # #region agent log
    path = getattr(getattr(request, "url", None), "path", "?") or "?"
    _debug_log("parsing_main.py:global_exception_handler", "Unhandled exception", {"path": path, "error_type": type(exc).__name__, "error_msg": str(exc)}, "H3")
    # #endregion
    logger.exception("Unhandled exception")
    detail = str(exc) if settings.DEBUG else "Internal server error"
    return JSONResponse(
        status_code=500,
        content={"detail": detail},
        media_type="application/json",
    )
