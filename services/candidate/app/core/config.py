"""
Configuration de l'application
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator


class Settings(BaseSettings):
    """Configuration de l'application"""

    # Application
    APP_NAME: str = "candidate-service"
    APP_ENV: str = "development"
    DEBUG: bool = True
    # Offres d'emploi : exiger profil complet pour postuler (effet Leurre). Seuil en % (ex: 80).
    REQUIRE_FULL_PROFILE_FOR_APPLY: bool = True
    PROFILE_COMPLETION_THRESHOLD: int = 80

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "yemma_db"
    DATABASE_URL: str = ""

    # JWT Validation
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    AUTH_SERVICE_URL: str = "http://localhost:8001"
    
    # Document Service
    DOCUMENT_SERVICE_URL: str = "http://localhost:8003"

    # Hrflow.ai - Parsing CV (https://developers.hrflow.ai/reference/parse-a-resume)
    HRFLOW_API_URL: str = "https://api.hrflow.ai/v1"
    HRFLOW_API_KEY: str = ""
    HRFLOW_USER_EMAIL: str = ""
    HRFLOW_SOURCE_KEY: str = ""  # Source Key où les CV parsés sont indexés
    # Search Service
    SEARCH_SERVICE_URL: str = "http://localhost:8004"
    # Notification Service (port 8007 en local, cf. docker-compose NOTIFICATION_PORT)
    NOTIFICATION_SERVICE_URL: str = "http://localhost:8007"
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:3000"
    INTERNAL_SERVICE_TOKEN: Optional[str] = None

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_URL: str = ""
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000", "http://localhost"],
        description="Allowed CORS origins"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )
    
    @model_validator(mode="before")
    @classmethod
    def parse_cors_origins(cls, data: dict) -> dict:
        """Parse CORS_ORIGINS from JSON string if provided"""
        if isinstance(data, dict) and "CORS_ORIGINS" in data:
            if isinstance(data["CORS_ORIGINS"], str):
                import json
                try:
                    data["CORS_ORIGINS"] = json.loads(data["CORS_ORIGINS"])
                except json.JSONDecodeError:
                    # Si ce n'est pas du JSON, essayer de split par virgule
                    data["CORS_ORIGINS"] = [origin.strip() for origin in data["CORS_ORIGINS"].split(",")]
        return data

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Construire DATABASE_URL si non fournie
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
        # Construire REDIS_URL si non fournie
        if not self.REDIS_URL:
            auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
            self.REDIS_URL = f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/0"


settings = Settings()

