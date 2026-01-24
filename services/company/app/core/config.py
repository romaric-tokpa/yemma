"""
Configuration de l'application
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Configuration de l'application"""

    # Application
    APP_NAME: str = "company-service"
    APP_ENV: str = "development"
    DEBUG: bool = True

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
    INTERNAL_SERVICE_TOKEN_SECRET: str = Field(default="", description="Secret for internal service tokens")

    # Invitation
    INVITATION_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Invitation token expiration in days")
    INVITATION_SECRET_KEY: str = Field(default="", description="Secret key for invitation tokens")

    # Service URLs
    SEARCH_SERVICE_URL: str = Field(default="http://localhost:8004", description="Search service URL")
    SUBSCRIPTION_SERVICE_URL: str = Field(default="http://localhost:8005", description="Subscription service URL")
    NOTIFICATION_SERVICE_URL: str = Field(default="http://localhost:8007", description="Notification service URL")
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="Frontend URL")

    # CORS (défini comme string pour éviter les problèmes de parsing)
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:8000,http://localhost",
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

