"""
Configuration de l'application
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


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
    CANDIDATE_SERVICE_URL: str = Field(default="http://localhost:8002", description="Candidate service URL")
    SEARCH_SERVICE_URL: str = Field(default="http://localhost:8004", description="Search service URL")
    PAYMENT_SERVICE_URL: str = Field(default="http://localhost:8006", description="Payment service URL")
    NOTIFICATION_SERVICE_URL: str = Field(default="http://localhost:8007", description="Notification service URL")
    AUDIT_SERVICE_URL: str = Field(default="http://localhost:8008", description="Audit service URL")
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="Frontend URL for profile links")

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"],
        description="Allowed CORS origins"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Construire DATABASE_URL si non fournie
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )


settings = Settings()

