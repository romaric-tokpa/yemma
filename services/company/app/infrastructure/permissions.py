"""
Middleware et dépendances pour les permissions RBAC
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.models import Company, Recruiter
from app.infrastructure.database import get_session
from app.infrastructure.auth import get_current_user, TokenData
from app.core.exceptions import PermissionDeniedError, CompanyNotFoundError


async def require_company_admin(
    company_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Company:
    """
    Dependency qui vérifie que l'utilisateur est admin de l'entreprise
    """
    # Récupérer l'entreprise
    statement = select(Company).where(
        Company.id == company_id,
        Company.deleted_at.is_(None)
    )
    result = await session.execute(statement)
    company = result.scalar_one_or_none()
    
    if not company:
        raise CompanyNotFoundError(str(company_id))
    
    # Vérifier que l'utilisateur est l'admin de l'entreprise
    if company.admin_id != current_user.user_id:
        # Vérifier si l'utilisateur a le rôle SUPER_ADMIN
        if "ROLE_SUPER_ADMIN" not in current_user.roles:
            raise PermissionDeniedError("Only company admin can perform this action")
    
    return company


async def require_recruiter_access(
    company_id: Optional[int] = None,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Recruiter:
    """
    Dependency qui vérifie que l'utilisateur est recruteur (ou admin) de l'entreprise
    Retourne le Recruiter si trouvé
    """
    # Vérifier si l'utilisateur est SUPER_ADMIN (accès total)
    if "ROLE_SUPER_ADMIN" in current_user.roles:
        # Pour un super admin, on peut créer un Recruiter factice
        # ou retourner None si company_id n'est pas fourni
        if company_id:
            statement = select(Company).where(Company.id == company_id)
            result = await session.execute(statement)
            company = result.scalar_one_or_none()
            if company:
                # Créer un objet Recruiter factice pour le super admin
                return Recruiter(
                    id=0,
                    user_id=current_user.user_id,
                    company_id=company_id,
                    status="active"
                )
        return None
    
    # Récupérer le recruteur
    statement = select(Recruiter).where(
        Recruiter.user_id == current_user.user_id,
        Recruiter.deleted_at.is_(None),
        Recruiter.status == "active"
    )
    
    if company_id:
        statement = statement.where(Recruiter.company_id == company_id)
    
    result = await session.execute(statement)
    recruiter = result.scalar_one_or_none()
    
    if not recruiter:
        raise PermissionDeniedError("You must be an active recruiter to access this resource")
    
    # Si company_id est fourni, vérifier qu'il correspond
    if company_id and recruiter.company_id != company_id:
        raise PermissionDeniedError("You don't have access to this company")
    
    return recruiter


async def require_company_master(
    company_id: int,
    current_user: TokenData = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Company:
    """
    Dependency qui vérifie que l'utilisateur est le compte maître de l'entreprise
    (pour accès aux factures, etc.)
    """
    # Récupérer l'entreprise
    statement = select(Company).where(
        Company.id == company_id,
        Company.deleted_at.is_(None)
    )
    result = await session.execute(statement)
    company = result.scalar_one_or_none()
    
    if not company:
        raise CompanyNotFoundError(str(company_id))
    
    # Vérifier que l'utilisateur est le compte maître
    if company.admin_id != current_user.user_id:
        # Seul le SUPER_ADMIN peut bypass
        if "ROLE_SUPER_ADMIN" not in current_user.roles:
            raise PermissionDeniedError("Only company master can access this resource")
    
    return company


def can_view_validated_candidates(current_user: TokenData) -> bool:
    """
    Vérifie si l'utilisateur peut voir les candidats validés
    Les recruteurs et admins peuvent voir les candidats validés
    """
    allowed_roles = [
        "ROLE_RECRUITER",
        "ROLE_COMPANY_ADMIN",
        "ROLE_ADMIN",
        "ROLE_SUPER_ADMIN"
    ]
    return any(role in current_user.roles for role in allowed_roles)


def can_access_invoices(current_user: TokenData) -> bool:
    """
    Vérifie si l'utilisateur peut accéder aux factures
    Seul le compte maître (COMPANY_ADMIN) peut accéder aux factures
    """
    return "ROLE_COMPANY_ADMIN" in current_user.roles or "ROLE_SUPER_ADMIN" in current_user.roles

