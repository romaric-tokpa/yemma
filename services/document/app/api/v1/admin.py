"""
Endpoints d'administration pour le service Document
"""
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.domain.models import Document, DocumentStatus
from app.domain.schemas import DocumentResponse
from app.infrastructure.database import get_session
from app.infrastructure.storage import s3_storage
from app.core.exceptions import DocumentError

# Import pour l'authentification interne
import sys
import os
shared_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "shared")
if shared_path not in sys.path:
    sys.path.insert(0, shared_path)

from services.shared.internal_auth import verify_service_token
from fastapi import Header

router = APIRouter()


async def verify_internal_token(
    x_service_token: str = Header(..., alias="X-Service-Token"),
    x_service_name: str = Header(..., alias="X-Service-Name"),
):
    """Vérifie le token de service interne"""
    payload = verify_service_token(x_service_token)
    if not payload or payload.get("service") != x_service_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing service token"
        )
    return payload


@router.post("/cleanup/rejected", status_code=status.HTTP_200_OK)
async def cleanup_rejected_documents(
    days_old: int = 30,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Nettoie automatiquement les documents REJECTED depuis plus de N jours
    
    - **days_old**: Nombre de jours après lesquels supprimer les documents (défaut: 30)
    - Nécessite un token de service interne
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    
    # Récupérer tous les documents REJECTED depuis plus de N jours
    statement = select(Document).where(
        and_(
            Document.status == DocumentStatus.REJECTED,
            Document.created_at < cutoff_date,
            Document.deleted_at.is_(None)  # Pas déjà supprimés
        )
    )
    
    result = await session.execute(statement)
    documents = result.scalars().all()
    
    deleted_count = 0
    errors = []
    
    for document in documents:
        try:
            # Supprimer le fichier de S3
            await s3_storage.delete_file(document.s3_key)
            
            # Marquer comme supprimé (soft delete)
            document.deleted_at = datetime.utcnow()
            await session.commit()
            deleted_count += 1
        except Exception as e:
            errors.append(f"Document {document.id}: {str(e)}")
            await session.rollback()
    
    return {
        "deleted_count": deleted_count,
        "errors": errors,
        "cutoff_date": cutoff_date.isoformat(),
        "message": f"Successfully deleted {deleted_count} rejected documents older than {days_old} days"
    }


@router.delete("/candidate/{candidate_id}", status_code=status.HTTP_200_OK)
async def delete_candidate_documents(
    candidate_id: int,
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Supprime tous les documents d'un candidat (pour anonymisation)
    
    - **candidate_id**: ID du candidat
    - Nécessite un token de service interne
    """
    # Récupérer tous les documents du candidat
    statement = select(Document).where(
        and_(
            Document.candidate_id == candidate_id,
            Document.deleted_at.is_(None)
        )
    )
    
    result = await session.execute(statement)
    documents = result.scalars().all()
    
    deleted_count = 0
    errors = []
    
    for document in documents:
        try:
            # Supprimer le fichier de S3
            await s3_storage.delete_file(document.s3_key)
            
            # Marquer comme supprimé (soft delete)
            document.deleted_at = datetime.utcnow()
            await session.commit()
            deleted_count += 1
        except Exception as e:
            errors.append(f"Document {document.id}: {str(e)}")
            await session.rollback()
    
    return {
        "candidate_id": candidate_id,
        "deleted_count": deleted_count,
        "errors": errors,
        "message": f"Successfully deleted {deleted_count} documents for candidate {candidate_id}"
    }

