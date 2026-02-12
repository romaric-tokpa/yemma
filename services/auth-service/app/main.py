"""
Auth Service - Point d'entrée principal
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1 import auth, users, anonymization, admin_invitations, oauth
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.infrastructure.database import init_db
from app.infrastructure.seed import seed_admin_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application"""
    # Startup: init_db (création des tables) puis migrations (colonnes manquantes)
    await init_db()
    import subprocess
    import os
    try:
        service_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        subprocess.run(["alembic", "upgrade", "head"], cwd=service_dir, check=False, capture_output=True)
    except Exception as e:
        print(f"⚠️  Migrations non exécutées: {e}")
    # Créer l'utilisateur administrateur par défaut si nécessaire
    try:
        await seed_admin_user()
    except Exception as e:
        # Ne pas bloquer le démarrage si le seed échoue
        print(f"⚠️  Erreur lors de la création de l'utilisateur administrateur: {e}")
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.APP_NAME,
    description="Service d'authentification et de gestion des utilisateurs",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
setup_exception_handlers(app)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(oauth.router, prefix="/api/v1/auth", tags=["OAuth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(anonymization.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(admin_invitations.router, prefix="/api/v1", tags=["Admin Invitations"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Auth Service API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }

