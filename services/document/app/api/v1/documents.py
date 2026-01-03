"""
Endpoints de gestion des documents
"""
import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.models import Document, DocumentType
from app.domain.schemas import (
    DocumentResponse,
    DocumentUploadResponse,
    DocumentViewResponse,
)
from app.core.config import settings
from app.core.exceptions import DocumentNotFoundError
from app.infrastructure.database import get_session, init_db
from app.infrastructure.storage import s3_storage
from app.infrastructure.file_validator import FileValidator

router = APIRouter()


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(..., description="Fichier à uploader (PDF, JPG, PNG, max 10MB)"),
    candidate_id: int = Form(..., description="ID du candidat"),
    document_type: DocumentType = Form(..., description="Type de document"),
    session: AsyncSession = Depends(get_session)
):
    """
    Upload un document
    
    - **file**: Fichier à uploader (PDF, JPG, PNG, max 10MB)
    - **candidate_id**: ID du candidat propriétaire
    - **document_type**: Type de document (CV, ATTESTATION, etc.)
    """
    # Valider le fichier (taille, extension, magic numbers)
    mime_type, file_content = await FileValidator.validate_file_content(file)
    
    # Générer un nom de fichier unique
    file_extension = file.filename.rsplit('.', 1)[1].lower()
    stored_filename = f"{uuid.uuid4()}.{file_extension}"
    s3_key = f"candidates/{candidate_id}/{document_type.value.lower()}/{stored_filename}"
    
    # Upload vers S3
    await s3_storage.upload_file(
        file_content=file_content,
        s3_key=s3_key,
        content_type=mime_type
    )
    
    # Créer l'enregistrement en base de données
    document = Document(
        candidate_id=candidate_id,
        document_type=document_type,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_size=len(file_content),
        mime_type=mime_type,
        s3_key=s3_key,
        status="uploaded"
    )
    
    session.add(document)
    await session.commit()
    await session.refresh(document)
    
    return DocumentUploadResponse(
        id=document.id,
        candidate_id=document.candidate_id,
        document_type=document.document_type.value,
        original_filename=document.original_filename,
        file_size=document.file_size,
        mime_type=document.mime_type,
        status=document.status.value,
        message="Document uploaded successfully"
    )


@router.get("/view/{document_id}", response_model=DocumentViewResponse)
async def view_document(
    document_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Génère un lien présigné temporaire pour visualiser un document
    
    - **document_id**: ID du document
    """
    # Récupérer le document
    statement = select(Document).where(
        Document.id == document_id,
        Document.deleted_at.is_(None)
    )
    result = await session.execute(statement)
    document = result.scalar_one_or_none()
    
    if not document:
        raise DocumentNotFoundError(str(document_id))
    
    # Générer l'URL présignée
    expiration_seconds = settings.TEMP_LINK_EXPIRE_HOURS * 3600
    presigned_url = await s3_storage.generate_presigned_url(
        s3_key=document.s3_key,
        expiration=expiration_seconds
    )
    
    expires_at = datetime.utcnow() + timedelta(seconds=expiration_seconds)
    
    return DocumentViewResponse(
        document_id=document.id,
        view_url=presigned_url,
        expires_at=expires_at,
        expires_in_seconds=expiration_seconds
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère les informations d'un document
    
    - **document_id**: ID du document
    """
    statement = select(Document).where(
        Document.id == document_id,
        Document.deleted_at.is_(None)
    )
    result = await session.execute(statement)
    document = result.scalar_one_or_none()
    
    if not document:
        raise DocumentNotFoundError(str(document_id))
    
    return DocumentResponse(
        id=document.id,
        candidate_id=document.candidate_id,
        document_type=document.document_type.value,
        original_filename=document.original_filename,
        file_size=document.file_size,
        mime_type=document.mime_type,
        status=document.status.value,
        created_at=document.created_at,
        updated_at=document.updated_at
    )


@router.get("/candidate/{candidate_id}", response_model=List[DocumentResponse])
async def get_candidate_documents(
    candidate_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère tous les documents d'un candidat
    
    - **candidate_id**: ID du candidat
    """
    statement = select(Document).where(
        Document.candidate_id == candidate_id,
        Document.deleted_at.is_(None)
    ).order_by(Document.created_at.desc())
    
    result = await session.execute(statement)
    documents = result.scalars().all()
    
    return [
        DocumentResponse(
            id=doc.id,
            candidate_id=doc.candidate_id,
            document_type=doc.document_type.value,
            original_filename=doc.original_filename,
            file_size=doc.file_size,
            mime_type=doc.mime_type,
            status=doc.status.value,
            created_at=doc.created_at,
            updated_at=doc.updated_at
        )
        for doc in documents
    ]

