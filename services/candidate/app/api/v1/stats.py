"""
Endpoints de statistiques pour le service Candidate
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict

from app.infrastructure.database import get_session
from app.infrastructure.internal_auth import verify_internal_token
from app.domain.models import Profile, ProfileStatus

router = APIRouter()


@router.get("/profiles/stats", response_model=Dict[str, int])
async def get_profiles_stats(
    service_info: dict = Depends(verify_internal_token),
    session: AsyncSession = Depends(get_session)
):
    """
    Récupère les statistiques des profils par statut
    
    Nécessite un token de service interne
    """
    # Compter les profils par statut
    statement = select(
        Profile.status,
        func.count(Profile.id).label('count')
    ).group_by(Profile.status)
    
    result = await session.execute(statement)
    rows = result.all()
    
    # Initialiser tous les statuts à 0
    stats = {
        "DRAFT": 0,
        "SUBMITTED": 0,
        "IN_REVIEW": 0,
        "VALIDATED": 0,
        "REJECTED": 0,
        "ARCHIVED": 0
    }
    
    # Mettre à jour avec les valeurs réelles
    for row in rows:
        status_value = row.status.value if isinstance(row.status, ProfileStatus) else str(row.status)
        count = row.count
        if status_value in stats:
            stats[status_value] = count
    
    return stats

