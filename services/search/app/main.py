"""
Search Service - Point d'entrée principal
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import search, indexing, candidates, stats
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.infrastructure.elasticsearch import init_elasticsearch

app = FastAPI(
    title="Search Service",
    description="Service de recherche de profils candidats avec ElasticSearch",
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
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
app.include_router(indexing.router, prefix="/api/v1/indexing", tags=["Indexing"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["Candidates"])
app.include_router(stats.router, prefix="/api/v1/search/stats", tags=["Stats"])


@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage"""
    await init_elasticsearch()


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "search-service",
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Search Service API",
        "version": "1.0.0",
        "docs": "/docs",
    }

