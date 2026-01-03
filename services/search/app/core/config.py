"""
Configuration de l'application
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Configuration de l'application"""

    # Application
    APP_NAME: str = "search-service"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # ElasticSearch
    ELASTICSEARCH_HOST: str = Field(default="localhost", description="ElasticSearch host")
    ELASTICSEARCH_PORT: int = Field(default=9200, description="ElasticSearch port")
    ELASTICSEARCH_USER: str = Field(default="", description="ElasticSearch user")
    ELASTICSEARCH_PASSWORD: str = Field(default="", description="ElasticSearch password")
    ELASTICSEARCH_USE_SSL: bool = Field(default=False, description="Use SSL for ElasticSearch")
    ELASTICSEARCH_VERIFY_CERTS: bool = Field(default=False, description="Verify SSL certificates")
    ELASTICSEARCH_INDEX_NAME: str = Field(default="certified_candidates", description="ElasticSearch index name")

    # RabbitMQ (pour consommation de messages)
    RABBITMQ_HOST: str = Field(default="localhost", description="RabbitMQ host")
    RABBITMQ_PORT: int = Field(default=5672, description="RabbitMQ port")
    RABBITMQ_USER: str = Field(default="rabbitmq", description="RabbitMQ user")
    RABBITMQ_PASSWORD: str = Field(default="", description="RabbitMQ password")
    RABBITMQ_VHOST: str = Field(default="/", description="RabbitMQ virtual host")

    # Service URLs
    CANDIDATE_SERVICE_URL: str = Field(default="http://localhost:8002", description="Candidate service URL")
    ADMIN_SERVICE_URL: str = Field(default="http://localhost:8009", description="Admin service URL")
    PAYMENT_SERVICE_URL: str = Field(default="http://localhost:8006", description="Payment service URL")
    AUDIT_SERVICE_URL: str = Field(default="http://localhost:8008", description="Audit service URL")
    COMPANY_SERVICE_URL: str = Field(default="http://localhost:8005", description="Company service URL")
    AUTH_SERVICE_URL: str = Field(default="http://localhost:8001", description="Auth service URL")
    
    # JWT Validation
    JWT_SECRET_KEY: str = Field(default="", description="JWT secret key for token validation")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")

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


settings = Settings()

