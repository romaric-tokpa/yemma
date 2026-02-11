"""
Candidate Service - Point d'entrée principal
"""
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.core.config import settings
from app.api.v1 import profiles, stats

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Candidate Service",
    description="Service de gestion des profils candidats",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - DOIT être ajouté AVANT les routes pour gérer les erreurs
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Routes : stats AVANT profiles pour que /api/v1/profiles/stats matche avant /profiles/{profile_id}
app.include_router(stats.router, prefix="/api/v1", tags=["Stats"])
app.include_router(profiles.router, prefix="/api/v1")


# Gestionnaire d'erreurs global pour garantir que les headers CORS sont toujours envoyés
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Gestionnaire d'erreurs global qui garantit que les headers CORS sont envoyés"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Créer une réponse avec les headers CORS
    origin = request.headers.get("origin")
    headers = {}
    
    # Ajouter les headers CORS si l'origin est autorisé
    if origin in settings.CORS_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    detail = f"Internal server error: {str(exc)}" if settings.DEBUG else "Internal server error"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": detail},
        headers=headers
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Gestionnaire pour les erreurs SQLAlchemy"""
    logger.error(f"Database error: {exc}", exc_info=True)
    
    origin = request.headers.get("origin")
    headers = {}
    
    if origin in settings.CORS_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    detail = str(exc) if settings.DEBUG else "Database error occurred"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": detail},
        headers=headers
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Gestionnaire pour les erreurs de validation"""
    origin = request.headers.get("origin")
    headers = {}
    
    if origin in settings.CORS_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers=headers
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Gestionnaire pour les erreurs HTTP (401, 403, etc.)"""
    origin = request.headers.get("origin")
    headers = {}
    
    # Ajouter les headers CORS si l'origin est autorisé
    if origin in settings.CORS_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers
    )


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint (sans dépendance DB)."""
    return {
        "status": "healthy",
        "service": "candidate-service",
        "version": "1.0.0",
    }


@app.get("/health/ready", tags=["Health"])
async def readiness_check():
    """Readiness : vérifie que le service et la base de données sont joignables."""
    from app.infrastructure.database import check_db_connection
    db_ok = await check_db_connection()
    if not db_ok:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "service": "candidate-service",
                "database": "disconnected",
            },
        )
    return {
        "status": "healthy",
        "service": "candidate-service",
        "database": "connected",
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Candidate Service API",
        "version": "1.0.0",
        "docs": "/docs",
    }

