"""
Endpoints pour les traces de profils supprimés
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.schemas import (
    DeletedProfileAuditCreate,
    DeletedProfileAuditResponse,
    DeletedProfileAuditListResponse,
)
from app.infrastructure.database import get_session
from app.infrastructure.repositories import DeletedProfileAuditRepository
from app.infrastructure.internal_auth import verify_internal_token

router = APIRouter()


@router.post("", response_model=DeletedProfileAuditResponse, status_code=status.HTTP_201_CREATED)
async def create_deleted_profile_audit(
    data: DeletedProfileAuditCreate,
    session: AsyncSession = Depends(get_session),
    service_info: dict = Depends(verify_internal_token),
):
    """
    Enregistre une trace de profil supprimé (appelé par le service candidate).
    Requiert un token de service interne.
    """
    repo = DeletedProfileAuditRepository(session)
    record = await repo.create(data.model_dump())
    return DeletedProfileAuditResponse.model_validate(record)


@router.get("", response_model=DeletedProfileAuditListResponse)
async def list_deleted_profiles(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    session: AsyncSession = Depends(get_session),
    service_info: dict = Depends(verify_internal_token),
):
    """
    Liste les profils supprimés (pour le dashboard admin).
    Requiert un token de service interne.
    """
    repo = DeletedProfileAuditRepository(session)
    items, total = await repo.list_all(limit=limit, offset=offset, start_date=start_date, end_date=end_date)
    return DeletedProfileAuditListResponse(
        total=total,
        items=[DeletedProfileAuditResponse.model_validate(item) for item in items],
    )
