"""
Endpoints de statistiques pour le service Candidate
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Optional

from app.infrastructure.database import get_session
from app.infrastructure.internal_auth import verify_internal_token
from app.infrastructure.auth import get_current_user, TokenData
from app.domain.models import Profile, ProfileStatus

router = APIRouter()


@router.get("/profiles/stats", response_model=Dict[str, int])
async def get_profiles_stats(
    session: AsyncSession = Depends(get_session),
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    Récupère les statistiques des profils par statut
    
    Accessible aux administrateurs (ROLE_ADMIN, ROLE_SUPER_ADMIN)
    """
    # Vérifier que c'est un admin
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # S'assurer que roles est une liste
    user_roles = current_user.roles if isinstance(current_user.roles, list) else []
    if "ROLE_ADMIN" not in user_roles and "ROLE_SUPER_ADMIN" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access this resource"
        )
    
    # Compter les profils par statut
    statement = select(
        Profile.status,
        func.count(Profile.id).label('count')
    ).where(
        Profile.deleted_at.is_(None)  # Exclure les profils supprimés (soft delete)
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

