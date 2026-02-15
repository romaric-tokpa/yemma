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

from app.domain.models import Document, DocumentType, DocumentStatus
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


@router.options("/upload")
async def options_upload():
    """Gérer les requêtes OPTIONS pour /upload"""
    from app.core.config import settings
    from fastapi.responses import Response
    
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
    )


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
        status=DocumentStatus.UPLOADED
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


@router.options("/upload/company-logo")
async def options_upload_company_logo():
    """Gérer les requêtes OPTIONS pour /upload/company-logo"""
    from fastapi.responses import Response
    
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
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


@router.options("/upload/profile-photo")
async def options_upload_profile_photo():
    """Gérer les requêtes OPTIONS pour /upload/profile-photo"""
    from fastapi.responses import Response

    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
    )


@router.post("/upload/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(..., description="Photo de profil (JPG, PNG, max 5MB)"),
    candidate_id: int = Form(..., description="ID du candidat"),
    session: AsyncSession = Depends(get_session)
):
    """
    Upload une photo de profil candidat

    - **file**: Photo à uploader (JPG, PNG, max 5MB)
    - **candidate_id**: ID du candidat

    Retourne l'URL permanente de la photo via le service /serve
    """
    try:
        logger.info(f"Upload profile photo: filename={file.filename}, candidate_id={candidate_id}")

        # Valider le fichier
        mime_type, file_content = await FileValidator.validate_file_content(file)

        # Vérifier la taille spécifique pour les photos (max 5MB)
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La photo ne doit pas dépasser 5 Mo"
            )

        # Vérifier que c'est une image
        if mime_type not in ['image/jpeg', 'image/png', 'image/webp']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier doit être une image (JPG, PNG, WebP)"
            )

        # Supprimer l'ancienne photo de profil si elle existe
        old_photo_statement = select(Document).where(
            Document.candidate_id == candidate_id,
            Document.document_type == DocumentType.PROFILE_PHOTO,
            Document.deleted_at.is_(None)
        )
        old_photo_result = await session.execute(old_photo_statement)
        old_photos = old_photo_result.scalars().all()

        for old_photo in old_photos:
            try:
                await s3_storage.delete_file(old_photo.s3_key)
                old_photo.deleted_at = datetime.utcnow()
                logger.info(f"Deleted old profile photo: {old_photo.id}")
            except Exception as e:
                logger.warning(f"Could not delete old photo {old_photo.id}: {str(e)}")

        # Générer un nom de fichier unique
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
        stored_filename = f"{uuid.uuid4()}.{file_extension}"
        s3_key = f"candidates/{candidate_id}/profile_photo/{stored_filename}"

        # Upload vers S3
        await s3_storage.upload_file(
            file_content=file_content,
            s3_key=s3_key,
            content_type=mime_type
        )
        logger.info(f"Successfully uploaded profile photo to S3: {s3_key}")

        # Créer l'enregistrement en base de données
        document = Document(
            candidate_id=candidate_id,
            document_type=DocumentType.PROFILE_PHOTO,
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_size=len(file_content),
            mime_type=mime_type,
            s3_key=s3_key,
            status=DocumentStatus.UPLOADED
        )

        session.add(document)
        await session.commit()
        await session.refresh(document)

        # Générer l'URL permanente via le service /serve
        serve_url = f"/api/v1/documents/serve/{document.id}"

        return {
            "id": document.id,
            "candidate_id": candidate_id,
            "document_type": "PROFILE_PHOTO",
            "serve_url": serve_url,
            "filename": stored_filename,
            "size": len(file_content),
            "mime_type": mime_type,
            "message": "Photo de profil uploadée avec succès"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading profile photo: {type(e).__name__}: {str(e)}", exc_info=True)
        err_msg = str(e)
        if "MinIO" in err_msg or "S3" in err_msg or "bucket" in err_msg.lower() or "connection" in err_msg.lower():
            detail = "Le stockage (MinIO) est indisponible. Vérifiez que MinIO est démarré (docker-compose up minio)."
        else:
            detail = f"Erreur lors du téléchargement de la photo: {err_msg}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
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


def _doc_to_response(doc) -> DocumentResponse:
    """Convertit un Document en DocumentResponse, gérant les enums ou strings."""
    doc_type = getattr(doc.document_type, 'value', doc.document_type) if doc.document_type else 'OTHER'
    doc_status = getattr(doc.status, 'value', doc.status) if doc.status else 'uploaded'
    return DocumentResponse(
        id=doc.id,
        candidate_id=doc.candidate_id,
        document_type=doc_type if isinstance(doc_type, str) else str(doc_type),
        original_filename=doc.original_filename or '',
        file_size=doc.file_size or 0,
        mime_type=doc.mime_type or 'application/octet-stream',
        status=doc_status if isinstance(doc_status, str) else str(doc_status),
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        deleted_at=doc.deleted_at
    )


# IMPORTANT: /candidate/{candidate_id} doit être défini AVANT /{document_id}
# sinon FastAPI matche /candidate/10 avec /{document_id} (document_id="candidate")
@router.get("/candidate/{candidate_id}", response_model=List[DocumentResponse])
async def get_candidate_documents(
    candidate_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère tous les documents d'un candidat
    
    - **candidate_id**: ID du candidat (profile_id)
    """
    try:
        statement = select(Document).where(
            Document.candidate_id == candidate_id,
            Document.deleted_at.is_(None)
        ).order_by(Document.created_at.desc())
        
        result = await session.execute(statement)
        documents = result.scalars().all()
        
        return [_doc_to_response(doc) for doc in documents]
    except Exception as e:
        logger.exception(f"Error fetching documents for candidate {candidate_id}: {e}")
        err_msg = str(e)
        if "does not exist" in err_msg.lower() or "relation" in err_msg.lower():
            # Table inexistante : retourner liste vide pour ne pas bloquer le dashboard
            logger.warning(f"Table documents inexistante, retour liste vide")
            return []
        if "connection" in err_msg.lower() or "connect" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Impossible de se connecter à la base de données. Vérifiez que PostgreSQL est démarré."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des documents: {err_msg}"
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


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    document_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Supprime un document (soft delete)
    
    - **document_id**: ID du document à supprimer
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
    
    try:
        # Supprimer le fichier de S3
        try:
            await s3_storage.delete_file(document.s3_key)
            logger.info(f"Successfully deleted file from S3: {document.s3_key}")
        except ClientError as e:
            # Si le fichier n'existe pas déjà dans S3, on continue quand même
            logger.warning(f"File not found in S3 (may already be deleted): {document.s3_key}, error: {str(e)}")
        
        # Marquer comme supprimé (soft delete)
        document.deleted_at = datetime.utcnow()
        document.updated_at = datetime.utcnow()
        await session.commit()
        await session.refresh(document)
        
        logger.info(f"Successfully deleted document {document_id}")
        
        return {
            "message": "Document deleted successfully",
            "document_id": document_id
        }
    except Exception as e:
        await session.rollback()
        logger.error(f"Error deleting document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression du document: {str(e)}"
        )

