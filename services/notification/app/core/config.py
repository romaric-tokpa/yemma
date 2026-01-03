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

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "yemma_db"
    DATABASE_URL: str = ""

    # Email Provider (smtp, sendgrid, mailgun, fastapi_mail, mock)
    EMAIL_PROVIDER: str = Field(default="mock", description="Email provider: smtp, sendgrid, mailgun, fastapi_mail, mock")
    
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


