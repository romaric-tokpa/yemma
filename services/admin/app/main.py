"""
Admin Service - Point d'entrée principal
"""
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import validation, stats
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers

app = FastAPI(
    title="Admin Service",
    description="Service d'administration et de validation des profils candidats",
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
app.include_router(validation.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(stats.router, prefix="/api/v1/admin", tags=["Admin"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "admin-service",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"], include_in_schema=False)
async def root():
    """Root endpoint - Redirige vers la documentation"""
    return RedirectResponse(url="/docs")

