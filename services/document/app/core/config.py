"""
Configuration de l'application
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Configuration de l'application"""

    # Application
    APP_NAME: str = "document-service"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "yemma_db"
    DATABASE_URL: str = ""

    # S3 / MinIO
    S3_ENDPOINT: str = Field(default="http://localhost:9000", description="S3 endpoint (MinIO) - interne Docker")
    S3_PUBLIC_ENDPOINT: str = Field(default="http://localhost:9000", description="S3 endpoint public (accessible depuis le navigateur)")
    S3_ACCESS_KEY: str = Field(default="minioadmin", description="S3 access key")
    S3_SECRET_KEY: str = Field(default="minioadmin", description="S3 secret key")
    S3_BUCKET_NAME: str = Field(default="documents", description="S3 bucket name")
    S3_REGION: str = Field(default="us-east-1", description="S3 region")
    S3_USE_SSL: bool = Field(default=False, description="Use SSL for S3")
    S3_FORCE_PATH_STYLE: bool = Field(default=True, description="Force path style (for MinIO)")
    S3_SERVER_SIDE_ENCRYPTION: str = Field(default="AES256", description="Server-Side Encryption algorithm (AES256, aws:kms)")
    S3_KMS_KEY_ID: Optional[str] = Field(default=None, description="KMS Key ID (if using aws:kms encryption)")

    # File Upload
    MAX_FILE_SIZE: int = Field(default=10485760, description="Max file size in bytes (10MB)")
    ALLOWED_EXTENSIONS: str = Field(
        default="pdf,jpg,jpeg,png,docx",
        description="Allowed file extensions (comma-separated string)"
    )
    ALLOWED_MIME_TYPES: List[str] = Field(
        default=["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        description="Allowed MIME types"
    )

    # Temporary Links
    TEMP_LINK_EXPIRE_HOURS: int = Field(default=24, description="Temporary link expiration in hours")

    # JWT Validation
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    AUTH_SERVICE_URL: str = "http://localhost:8001"

    # CORS
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:8000,http://localhost",
        description="Allowed CORS origins (comma-separated string)"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        # Parser personnalisé pour ALLOWED_EXTENSIONS (string séparée par virgules)
        env_parse_none_str="",
    )
    
    @classmethod
    def parse_allowed_extensions(cls, v):
        """Parser pour convertir une string séparée par virgules en liste"""
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(',') if ext.strip()]
        return v if isinstance(v, list) else []

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Construire DATABASE_URL si non fournie
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        """Retourne ALLOWED_EXTENSIONS comme une liste"""
        if isinstance(self.ALLOWED_EXTENSIONS, str):
            return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(',') if ext.strip()]
        return self.ALLOWED_EXTENSIONS if isinstance(self.ALLOWED_EXTENSIONS, list) else []
    
    @staticmethod
    def _clean_origin(o: str) -> str:
        o = o.strip().strip('"').strip("'").strip()
        return o

    @property
    def cors_origins_list(self) -> List[str]:
        """Retourne CORS_ORIGINS comme une liste (guillemets retirés pour éviter CORS invalide)."""
        if isinstance(self.CORS_ORIGINS, str):
            return [self._clean_origin(o) for o in self.CORS_ORIGINS.split(',') if o.strip()]
        if isinstance(self.CORS_ORIGINS, list):
            return [self._clean_origin(str(x)) for x in self.CORS_ORIGINS]
        return []

    @staticmethod
    def sanitize_cors_header_value(value: str) -> str:
        """Valeur sûre pour Access-Control-Allow-Origin (sans guillemets)."""
        if not value or value == "*":
            return value or "*"
        v = value.strip().strip('"').strip("'").strip()
        return v or "*"


settings = Settings()

