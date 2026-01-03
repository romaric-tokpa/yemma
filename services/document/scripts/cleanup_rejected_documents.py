#!/usr/bin/env python3
"""
Script de nettoyage automatique des documents REJECTED
À exécuter via cron ou Celery Beat pour supprimer les documents REJECTED depuis plus de 30 jours
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta

# Ajouter le chemin du service au PYTHONPATH
service_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if service_path not in sys.path:
    sys.path.insert(0, service_path)

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy import select, and_
from sqlmodel import SQLModel

from app.domain.models import Document, DocumentStatus
from app.infrastructure.storage import s3_storage
from app.core.config import settings
from app.infrastructure.database import AsyncSessionLocal


async def cleanup_rejected_documents(days_old: int = 30):
    """
    Nettoie automatiquement les documents REJECTED depuis plus de N jours
    
    Args:
        days_old: Nombre de jours après lesquels supprimer les documents (défaut: 30)
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    
    print(f"[{datetime.utcnow()}] Starting cleanup of rejected documents older than {days_old} days (before {cutoff_date})")
    
    async with AsyncSessionLocal() as session:
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
                print(f"  ✓ Deleted document {document.id} (candidate {document.candidate_id})")
            except Exception as e:
                errors.append(f"Document {document.id}: {str(e)}")
                await session.rollback()
                print(f"  ✗ Error deleting document {document.id}: {str(e)}")
        
        print(f"[{datetime.utcnow()}] Cleanup completed: {deleted_count} documents deleted, {len(errors)} errors")
        
        if errors:
            print("Errors:")
            for error in errors:
                print(f"  - {error}")
        
        return {
            "deleted_count": deleted_count,
            "errors": errors,
            "cutoff_date": cutoff_date.isoformat()
        }


async def main():
    """Point d'entrée principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Cleanup rejected documents older than N days")
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="Number of days after which to delete rejected documents (default: 30)"
    )
    
    args = parser.parse_args()
    
    try:
        result = await cleanup_rejected_documents(days_old=args.days)
        print(f"\n✅ Success: {result['deleted_count']} documents deleted")
        if result['errors']:
            print(f"⚠️  {len(result['errors'])} errors occurred")
            sys.exit(1)
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

