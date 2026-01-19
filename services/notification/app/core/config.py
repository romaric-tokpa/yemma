"""
Configuration de l'application
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Configuration de l'application"""

    # Application
    APP_NAME: str = "notification-service"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = Field(default=8000, description="Server port")

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "yemma_db"
    DATABASE_URL: str = ""

    # Email Provider (smtp, sendgrid, mailgun, fastapi_mail, mock)
    EMAIL_PROVIDER: str = Field(default="fastapi_mail", description="Email provider: smtp, sendgrid, mailgun, fastapi_mail, mock")
    
    # SMTP Configuration
    SMTP_HOST: str = Field(default="smtp.gmail.com", description="SMTP host")
    SMTP_PORT: int = Field(default=587, description="SMTP port")
    SMTP_USER: str = Field(default="", description="SMTP username")
    SMTP_PASSWORD: str = Field(default="", description="SMTP password")
    SMTP_USE_TLS: bool = Field(default=True, description="Use TLS")
    SMTP_FROM_EMAIL: str = Field(default="noreply@yemma.com", description="From email address")
    SMTP_FROM_NAME: str = Field(default="Yemma Solutions", description="From name")
    
    # SendGrid Configuration
    SENDGRID_API_KEY: str = Field(default="", description="SendGrid API key")
    SENDGRID_FROM_EMAIL: str = Field(default="noreply@yemma.com", description="SendGrid from email")
    SENDGRID_FROM_NAME: str = Field(default="Yemma Solutions", description="SendGrid from name")
    
    # Mailgun Configuration
    MAILGUN_API_KEY: str = Field(default="", description="Mailgun API key")
    MAILGUN_DOMAIN: str = Field(default="", description="Mailgun domain")
    MAILGUN_FROM_EMAIL: str = Field(default="noreply@yemma.com", description="Mailgun from email")
    MAILGUN_FROM_NAME: str = Field(default="Yemma Solutions", description="Mailgun from name")
    
    # Redis (pour Celery)
    REDIS_HOST: str = Field(default="localhost", description="Redis host")
    REDIS_PORT: int = Field(default=6379, description="Redis port")
    REDIS_PASSWORD: str = Field(default="", description="Redis password")
    
    # Task Queue (background_tasks ou celery)
    TASK_QUEUE: str = Field(default="background_tasks", description="Task queue: background_tasks or celery")
    
    # Frontend URL (pour les liens dans les emails)
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="Frontend URL")
    
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


