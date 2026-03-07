"""
Endpoints pour les profils supprimés (trace d'audit)
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.infrastructure.auth import require_admin_role
from app.infrastructure.audit_client import get_deleted_profiles

router = APIRouter()


@router.get("/deleted-profiles")
async def list_deleted_profiles(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    _=Depends(require_admin_role),
):
    """
    Liste les profils candidats supprimés (auto-suppression par le candidat).
    Données issues du service Audit.
    """
    return await get_deleted_profiles(
        limit=limit,
        offset=offset,
        start_date=start_date,
        end_date=end_date,
    )
