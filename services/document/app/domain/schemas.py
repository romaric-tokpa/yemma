"""
Schémas Pydantic pour la validation des données
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.domain.models import DocumentType, DocumentStatus


class DocumentCreate(BaseModel):
    """Schéma pour la création d'un document"""
    candidate_id: int = Field(..., description="ID du candidat")
    document_type: DocumentType = Field(..., description="Type de document")


class DocumentResponse(BaseModel):
    """Schéma de réponse pour un document"""
    id: int
    candidate_id: int
    document_type: str
    original_filename: str
    file_size: int
    mime_type: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    """Schéma de réponse après upload"""
    id: int
    candidate_id: int
    document_type: str
    original_filename: str
    file_size: int
    mime_type: str
    status: str
    message: str = "Document uploaded successfully"


class DocumentViewResponse(BaseModel):
    """Schéma de réponse pour la visualisation"""
    document_id: int
    view_url: str
    expires_at: datetime
    expires_in_seconds: int

