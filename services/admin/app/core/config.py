"""
Configuration de l'application
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator
import json


class Settings(BaseSettings):
    """Configuration de l'application"""

    # Application
    APP_NAME: str = "admin-service"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "yemma_db"
    DATABASE_URL: str = ""

    # Service URLs
    # Par défaut, utiliser les noms de conteneurs Docker (pour fonctionnement dans Docker)
    # En local, ces valeurs seront surchargées par les variables d'environnement
    CANDIDATE_SERVICE_URL: str = Field(default="http://candidate:8000", description="Candidate service URL")
    SEARCH_SERVICE_URL: str = Field(default="http://search:8000", description="Search service URL")
    PAYMENT_SERVICE_URL: str = Field(default="http://payment:8000", description="Payment service URL")
    NOTIFICATION_SERVICE_URL: str = Field(default="http://notification:8000", description="Notification service URL")
    AUDIT_SERVICE_URL: str = Field(default="http://audit:8000", description="Audit service URL")
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="Frontend URL for profile links")

    # HrFlow.ai - Profile Asking API (CvGPT)
    HRFLOW_API_KEY: str = Field(default="", description="HrFlow API key for Profile Asking")
    HRFLOW_SOURCE_KEY: str = Field(default="", description="HrFlow source key where profiles are indexed")
    HRFLOW_API_URL: str = Field(default="https://api.hrflow.ai/v1", description="HrFlow API base URL")
    HRFLOW_USER_EMAIL: str = Field(default="", description="HrFlow account email (required for Asking API)")

    # JWT (validation des tokens utilisateur - même secret que Auth Service)
    JWT_SECRET_KEY: str = Field(default="", description="Secret key for JWT validation (must match Auth Service)")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")

    # CORS (défini comme string pour éviter les problèmes de parsing)
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:8000",
        description="Allowed CORS origins (comma-separated string)"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Retourne CORS_ORIGINS comme une liste"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(',') if origin.strip()]
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else []

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Construire DATABASE_URL si non fournie
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )


settings = Settings()

