"""
Configuration de l'application via Pydantic BaseSettings
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator


class Settings(BaseSettings):
    """Configuration de l'application"""

    # Application
    APP_NAME: str = "auth-service"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = Field(default="development", description="Environment: development, staging, production")
    DEBUG: bool = Field(default=True, description="Debug mode")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")

    # Database
    DB_HOST: str = Field(default="localhost", description="Database host")
    DB_PORT: int = Field(default=5432, description="Database port")
    DB_USER: str = Field(default="auth_user", description="Database user")
    DB_PASSWORD: str = Field(default="", description="Database password")
    DB_NAME: str = Field(default="auth_db", description="Database name")
    DATABASE_URL: str = Field(default="", description="Full database URL")

    # JWT
    JWT_SECRET_KEY: str = Field(..., description="Secret key for JWT tokens")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Access token expiration in minutes")
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiration in days")

    # OAuth2
    OAUTH2_SECRET_KEY: str = Field(default="", description="Secret key for OAuth2")
    OAUTH2_TOKEN_URL: str = Field(default="/api/v1/auth/login", description="OAuth2 token URL")

    # Password
    PASSWORD_HASH_ALGORITHM: str = Field(default="bcrypt", description="Password hashing algorithm")
    PASSWORD_MIN_LENGTH: int = Field(default=8, description="Minimum password length")

    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:8000",
            "http://localhost",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8000",
            "http://127.0.0.1",
        ],
        description="Allowed CORS origins",
    )

    # RabbitMQ
    RABBITMQ_HOST: str = Field(default="localhost", description="RabbitMQ host")
    RABBITMQ_PORT: int = Field(default=5672, description="RabbitMQ port")
    RABBITMQ_USER: str = Field(default="rabbitmq", description="RabbitMQ user")
    RABBITMQ_PASSWORD: str = Field(default="", description="RabbitMQ password")
    RABBITMQ_VHOST: str = Field(default="/", description="RabbitMQ virtual host")
    RABBITMQ_URL: str = Field(default="", description="Full RabbitMQ URL")

    @model_validator(mode="before")
    @classmethod
    def build_urls(cls, data: dict) -> dict:
        """Construit les URLs si non fournies et parse CORS_ORIGINS"""
        if isinstance(data, dict):
            # Construire DATABASE_URL si non fournie
            if not data.get("DATABASE_URL"):
                db_user = data.get("DB_USER", "auth_user")
                db_password = data.get("DB_PASSWORD", "")
                db_host = data.get("DB_HOST", "localhost")
                db_port = data.get("DB_PORT", 5432)
                db_name = data.get("DB_NAME", "auth_db")
                data["DATABASE_URL"] = (
                    f"postgresql+asyncpg://{db_user}:{db_password}"
                    f"@{db_host}:{db_port}/{db_name}"
                )
            
            # Construire RABBITMQ_URL si non fournie
            if not data.get("RABBITMQ_URL"):
                rmq_user = data.get("RABBITMQ_USER", "rabbitmq")
                rmq_password = data.get("RABBITMQ_PASSWORD", "")
                rmq_host = data.get("RABBITMQ_HOST", "localhost")
                rmq_port = data.get("RABBITMQ_PORT", 5672)
                rmq_vhost = data.get("RABBITMQ_VHOST", "/")
                data["RABBITMQ_URL"] = (
                    f"amqp://{rmq_user}:{rmq_password}"
                    f"@{rmq_host}:{rmq_port}{rmq_vhost}"
                )
            
            # Parser CORS_ORIGINS depuis JSON si fourni comme chaîne
            if "CORS_ORIGINS" in data and isinstance(data["CORS_ORIGINS"], str):
                import json
                try:
                    data["CORS_ORIGINS"] = json.loads(data["CORS_ORIGINS"])
                except json.JSONDecodeError:
                    # Si ce n'est pas du JSON, essayer de split par virgule
                    data["CORS_ORIGINS"] = [origin.strip() for origin in data["CORS_ORIGINS"].split(",")]
        return data

    # External Services
    DOCUMENT_SERVICE_URL: str = Field(default="http://localhost:8003", description="Document Service URL")
    NOTIFICATION_SERVICE_URL: str = Field(default="http://localhost:8007", description="Notification service URL")
    INTERNAL_SERVICE_TOKEN_SECRET: str = Field(default="", description="Secret for internal service tokens")
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="Frontend URL for links in emails")
    
    # Security
    ALLOWED_HOSTS: List[str] = Field(default=["*"], description="Allowed hosts")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

