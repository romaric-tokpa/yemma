"""
Configuration du service de parsing CV
"""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuration principale du service"""

    # Application
    APP_NAME: str = "yemma-parsing-service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # HRFlow API (clé requise pour le parsing - placeholder en dev = erreur 502 explicite)
    HRFLOW_API_KEY: str = ""
    HRFLOW_SOURCE_KEY: str = ""
    HRFLOW_API_URL: str = "https://api.hrflow.ai/v1"
    HRFLOW_USER_EMAIL: Optional[str] = None  # Requis par l'API parsing dans certains cas

    # Database (PostgreSQL)
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/yemma_candidate"

    # Redis / Celery
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # Auth (pour validation des tokens)
    AUTH_SERVICE_URL: str = "http://auth:8000"
    INTERNAL_SERVICE_SECRET: Optional[str] = None

    # Timeouts
    HRFLOW_TIMEOUT: int = 60
    PARSE_MAX_RETRIES: int = 3

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Utiliser REDIS_URL comme default pour Celery si non spécifié
        if not self.CELERY_BROKER_URL:
            self.CELERY_BROKER_URL = self.REDIS_URL
        if not self.CELERY_RESULT_BACKEND:
            self.CELERY_RESULT_BACKEND = self.REDIS_URL


@lru_cache()
def get_settings() -> Settings:
    """Retourne les settings (cached)"""
    return Settings()
