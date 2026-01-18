"""
Modèles du domaine métier (SQLModel)
"""
from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field


class DocumentType(str, Enum):
    """Types de documents"""
    CV = "CV"
    ATTESTATION = "ATTESTATION"
    CERTIFICATE = "CERTIFICATE"
    RECOMMENDATION_LETTER = "RECOMMENDATION_LETTER"
    DIPLOMA = "DIPLOMA"
    OTHER = "OTHER"


class DocumentStatus(str, Enum):
    """Statut du document"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Document(SQLModel, table=True):
    """Modèle Document"""
    __tablename__ = "documents"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    candidate_id: int = Field(index=True, description="ID du candidat propriétaire")
    document_type: DocumentType = Field(description="Type de document")
    original_filename: str = Field(max_length=255, description="Nom de fichier original")
    stored_filename: str = Field(max_length=255, description="Nom de fichier dans le stockage")
    file_size: int = Field(description="Taille du fichier en bytes")
    mime_type: str = Field(max_length=100, description="Type MIME du fichier")
    s3_key: str = Field(max_length=500, description="Clé S3 du fichier")
    status: DocumentStatus = Field(default=DocumentStatus.UPLOADED, description="Statut du document")
    document_metadata: Optional[str] = Field(default=None, sa_column_kwargs={'name': 'metadata'}, description="Métadonnées JSON (optionnel)")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Date de création")
    updated_at: Optional[datetime] = Field(default=None, description="Date de mise à jour")
    deleted_at: Optional[datetime] = Field(default=None, description="Date de suppression (soft delete)")

