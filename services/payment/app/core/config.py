"""
Configuration de l'application
"""
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# Chemin vers le .env du projet (racine yemma, depuis services/payment/app/core/)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
_ENV_FILE = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Configuration de l'application"""

    # Application
    APP_NAME: str = "payment-service"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = Field(default=8006, description="Port d'écoute du serveur")

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "yemma_db"
    DATABASE_URL: str = ""

    # Stripe (obligatoire pour checkout, placeholder en dev pour plans/subscriptions)
    STRIPE_SECRET_KEY: str = Field(default="sk_test_placeholder", description="Stripe secret key")
    STRIPE_PUBLISHABLE_KEY: str = Field(default="", description="Stripe publishable key")
    STRIPE_WEBHOOK_SECRET: str = Field(default="", description="Stripe webhook secret")
    STRIPE_CURRENCY: str = Field(default="eur", description="Currency for payments")
    TRIAL_DAYS: int = Field(default=3, description="Nombre de jours d'essai gratuit pour les abonnements")

    # Service URLs
    COMPANY_SERVICE_URL: str = Field(default="http://localhost:8005", description="Company service URL")
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="Frontend URL")

    # CORS (défini comme string pour éviter les problèmes de parsing)
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:8000,http://localhost",
        description="Allowed CORS origins (comma-separated string)"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Retourne CORS_ORIGINS comme une liste"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(',') if origin.strip()]
        return self.CORS_ORIGINS if isinstance(self.CORS_ORIGINS, list) else []

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE if _ENV_FILE.exists() else ".env",
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

