"""
Middleware pour récupérer l'entreprise de l'utilisateur actuel
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.models import Company, TeamMember, TeamMemberStatus, CompanyStatus
from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, TokenData
from app.core.exceptions import CompanyNotFoundError, PermissionDeniedError


async def get_current_company(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Company:
    """
    Dependency qui récupère l'entreprise de l'utilisateur actuel
    
    Vérifie que l'utilisateur est membre actif d'une entreprise
    et retourne cette entreprise.
    
    Utilisé pour sécuriser les routes et s'assurer qu'un recruteur
    ne voit que les données de son entreprise.
    """
    # Vérifier si l'utilisateur est SUPER_ADMIN (accès total)
    if "ROLE_SUPER_ADMIN" in current_user.roles:
        # Pour un super admin, on peut retourner None ou lever une exception
        # selon le contexte. Ici, on lève une exception car get_current_company
        # nécessite une entreprise spécifique
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super admin must specify a company_id for this operation"
        )
    
    # Récupérer le TeamMember de l'utilisateur
    statement = select(TeamMember).where(
        TeamMember.user_id == current_user.user_id,
        TeamMember.deleted_at.is_(None),
        TeamMember.status == TeamMemberStatus.ACTIVE
    )
    
    result = await session.execute(statement)
    team_member = result.scalar_one_or_none()
    
    if not team_member:
        raise PermissionDeniedError(
            "You must be an active team member of a company to access this resource"
        )
    
    # Récupérer l'entreprise
    statement = select(Company).where(
        Company.id == team_member.company_id,
        Company.deleted_at.is_(None),
        Company.status == CompanyStatus.ACTIVE
    )
    result = await session.execute(statement)
    company = result.scalar_one_or_none()
    
    if not company:
        raise CompanyNotFoundError(f"Company {team_member.company_id} not found or inactive")
    
    return company


async def get_current_team_member(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> TeamMember:
    """
    Dependency qui récupère le TeamMember de l'utilisateur actuel
    
    Retourne le TeamMember avec son rôle dans l'entreprise.
    """
    # Vérifier si l'utilisateur est SUPER_ADMIN
    if "ROLE_SUPER_ADMIN" in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super admin must specify a company_id for this operation"
        )
    
    # Récupérer le TeamMember
    statement = select(TeamMember).where(
        TeamMember.user_id == current_user.user_id,
        TeamMember.deleted_at.is_(None),
        TeamMember.status == TeamMemberStatus.ACTIVE
    )
    
    result = await session.execute(statement)
    team_member = result.scalar_one_or_none()
    
    if not team_member:
        raise PermissionDeniedError(
            "You must be an active team member of a company to access this resource"
        )
    
    return team_member


async def require_company_admin_role(
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> tuple[Company, TeamMember]:
    """
    Dependency qui vérifie que l'utilisateur est ADMIN_ENTREPRISE
    
    Retourne l'entreprise et le TeamMember.
    """
    team_member = await get_current_team_member(current_user, session)
    
    if team_member.role_in_company != "ADMIN_ENTREPRISE":
        raise PermissionDeniedError(
            "Only company admin can perform this action"
        )
    
    # Récupérer l'entreprise
    statement = select(Company).where(
        Company.id == team_member.company_id,
        Company.deleted_at.is_(None)
    )
    result = await session.execute(statement)
    company = result.scalar_one_or_none()
    
    if not company:
        raise CompanyNotFoundError(f"Company {team_member.company_id} not found")
    
    return company, team_member

