"""
Company Service - Point d'entrée principal
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import companies, recruiters, invitations, invoices
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.infrastructure.database import init_db

app = FastAPI(
    title="Company Service",
    description="Service de gestion des entreprises et recruteurs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
app.include_router(companies.router, prefix="/api/v1/companies", tags=["Companies"])
app.include_router(recruiters.router, prefix="/api/v1/recruiters", tags=["Recruiters"])
app.include_router(invitations.router, prefix="/api/v1/invitations", tags=["Invitations"])
app.include_router(invoices.router, prefix="/api/v1", tags=["Invoices"])


@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage"""
    await init_db()


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "company-service",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Company Service API",
        "version": "1.0.0",
        "docs": "/docs",
    }

