"""
Endpoints de gestion des documents
"""
import uuid
import io
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, status, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from botocore.exceptions import ClientError

from app.domain.models import Document, DocumentType
from app.domain.schemas import (
    DocumentResponse,
    DocumentUploadResponse,
    DocumentViewResponse,
)
from app.core.config import settings
from app.core.exceptions import DocumentNotFoundError, DocumentError
from app.infrastructure.database import get_session, init_db
from app.infrastructure.storage import s3_storage
from app.infrastructure.file_validator import FileValidator

logger = logging.getLogger(__name__)

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
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Upload attempt: filename={file.filename}, candidate_id={candidate_id}, document_type={document_type}")
        # Valider le fichier (taille, extension, magic numbers)
        mime_type, file_content = await FileValidator.validate_file_content(file)
        logger.info(f"File validated: mime_type={mime_type}, size={len(file_content)}")
    except Exception as e:
        logger.error(f"Validation error: {type(e).__name__}: {str(e)}")
        raise
    
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


@router.post("/upload/company-logo")
async def upload_company_logo(
    file: UploadFile = File(..., description="Logo de l'entreprise (JPG, PNG, max 5MB)"),
    company_id: int = Form(..., description="ID de l'entreprise"),
):
    """
    Upload un logo d'entreprise
    
    - **file**: Logo à uploader (JPG, PNG, max 5MB)
    - **company_id**: ID de l'entreprise
    """
    try:
        logger.info(f"Upload company logo: filename={file.filename}, company_id={company_id}")
        
        # Valider le fichier (taille, extension, magic numbers)
        # FileValidator.validate_file_content va vérifier la taille (max 10MB par défaut)
        # On doit surcharger la vérification pour 5MB max
        mime_type, file_content = await FileValidator.validate_file_content(file)
        
        # Vérifier la taille spécifique pour les logos (max 5MB)
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier ne doit pas dépasser 5 Mo"
            )
        
        # Vérifier que c'est une image
        if mime_type not in ['image/jpeg', 'image/png']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier doit être une image (JPG, PNG)"
            )
        
        # Générer un nom de fichier unique
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'png'
        stored_filename = f"{uuid.uuid4()}.{file_extension}"
        s3_key = f"companies/{company_id}/logo/{stored_filename}"
        
        # Upload vers S3
        await s3_storage.upload_file(
            file_content=file_content,
            s3_key=s3_key,
            content_type=mime_type
        )
        logger.info(f"Successfully uploaded logo to S3: {s3_key}")
        
        # Générer l'URL publique
        # Si on utilise MinIO avec un endpoint public, on peut construire l'URL directement
        # Sinon, on génère une URL présignée
        if settings.S3_PUBLIC_ENDPOINT and settings.S3_FORCE_PATH_STYLE:
            # URL publique directe pour MinIO
            public_url = f"{settings.S3_PUBLIC_ENDPOINT}/{settings.S3_BUCKET_NAME}/{s3_key}"
        else:
            # URL présignée temporaire (24h)
            public_url = await s3_storage.generate_presigned_url(s3_key, expiration=86400)
        
        return {
            "url": public_url,
            "s3_key": s3_key,
            "filename": stored_filename,
            "size": len(file_content),
            "mime_type": mime_type
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading company logo: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du téléchargement du logo: {str(e)}"
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


@router.get("/serve/{document_id}")
@router.head("/serve/{document_id}")
async def serve_document(
    document_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Sert un document directement via le service (proxy vers MinIO)
    Utile pour éviter les problèmes de CORS et de résolution DNS avec les URLs présignées
    
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
        logger.warning(f"Document {document_id} not found")
        raise DocumentNotFoundError(str(document_id))
    
    # Récupérer le fichier depuis S3 de manière asynchrone
    try:
        logger.info(f"Serving document {document_id} with key {document.s3_key}")
        
        # Utiliser asyncio.to_thread pour rendre l'appel boto3 asynchrone
        def _download_file():
            """Fonction synchrone pour télécharger le fichier depuis S3"""
            try:
                response = s3_storage.client.get_object(
                    Bucket=s3_storage.bucket_name,
                    Key=document.s3_key
                )
                return response['Body'].read()
            except ClientError as e:
                logger.error(f"Error downloading file from S3: {str(e)}")
                raise
        
        file_content = await asyncio.to_thread(_download_file)
        logger.info(f"Successfully downloaded document {document_id}, size: {len(file_content)} bytes")
        
        # Retourner le fichier avec les headers appropriés
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=document.mime_type,
            headers={
                "Content-Disposition": f'inline; filename="{document.original_filename}"',
                "Cache-Control": "public, max-age=3600",
                "Content-Length": str(len(file_content))
            }
        )
    except ClientError as e:
        logger.error(f"ClientError retrieving file {document_id}: {str(e)}")
        raise DocumentError(f"Failed to retrieve file: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error serving document {document_id}: {str(e)}", exc_info=True)
        raise DocumentError(f"Failed to retrieve file: {str(e)}")


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

