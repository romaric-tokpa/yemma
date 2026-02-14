"""
Configuration de l'application
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Configuration de l'application"""

    # Application
    APP_NAME: str = "audit-service"
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
    JWT_SECRET_KEY: str = Field(default="", description="JWT secret key for token validation")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    AUTH_SERVICE_URL: str = Field(default="http://localhost:8001", description="Auth service URL")
    
    # CORS (string comma-separated depuis .env/docker-compose, converti en liste)
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:8000",
        description="Allowed CORS origins (comma-separated)"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Retourne CORS_ORIGINS comme une liste"""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Construire DATABASE_URL si non fournie
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )


settings = Settings()


