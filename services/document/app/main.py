"""
Document Service - Point d'entrée principal
"""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1 import documents, admin
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.infrastructure.storage import init_storage
from app.infrastructure.database import init_db

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Document Service",
    description="Service de gestion et stockage des documents",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - Doit être en premier pour gérer les requêtes OPTIONS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Middleware supplémentaire pour gérer les requêtes OPTIONS si nécessaire
class OptionsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            origin = request.headers.get("origin")
            # Vérifier si l'origine est autorisée
            allowed_origins = settings.cors_origins_list
            if origin and origin in allowed_origins:
                allow_origin = origin
            elif "*" in allowed_origins or not allowed_origins:
                allow_origin = origin or "*"
            else:
                allow_origin = allowed_origins[0] if allowed_origins else "*"
            
            logger.info(f"OPTIONS request intercepted for origin: {origin}, allowing: {allow_origin}")
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": allow_origin,
                    "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS, PATCH",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "3600",
                }
            )
        return await call_next(request)

# Ajouter le middleware OPTIONS après CORS (sera exécuté en premier)
app.add_middleware(OptionsMiddleware)

# Exception handlers
setup_exception_handlers(app)

# Routers
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage"""
    await init_db()
    await init_storage()


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "document-service",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Document Service API",
        "version": "1.0.0",
        "docs": "/docs",
    }

