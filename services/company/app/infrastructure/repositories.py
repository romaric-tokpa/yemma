"""
Repositories pour l'accès aux données
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.domain.models import Company, TeamMember, Invitation
from app.domain.exceptions import CompanyNotFoundError


class CompanyRepository:
    """Repository pour les opérations sur les entreprises"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, company_id: int) -> Optional[Company]:
        """Récupère une entreprise par ID"""
        statement = select(Company).where(
            Company.id == company_id,
            Company.deleted_at.is_(None)
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_by_admin_id(self, admin_id: int) -> Optional[Company]:
        """Récupère une entreprise par admin_id"""
        statement = select(Company).where(
            Company.admin_id == admin_id,
            Company.deleted_at.is_(None)
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_by_legal_id(self, legal_id: str) -> Optional[Company]:
        """Récupère une entreprise par legal_id"""
        statement = select(Company).where(
            Company.legal_id == legal_id,
            Company.deleted_at.is_(None)
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def create(self, company: Company) -> Company:
        """Crée une nouvelle entreprise"""
        self.session.add(company)
        await self.session.commit()
        await self.session.refresh(company)
        return company
    
    async def update(self, company: Company) -> Company:
        """Met à jour une entreprise"""
        company.updated_at = datetime.utcnow()
        self.session.add(company)
        await self.session.commit()
        await self.session.refresh(company)
        return company


class TeamMemberRepository:
    """Repository pour les opérations sur les membres d'équipe"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, team_member_id: int) -> Optional[TeamMember]:
        """Récupère un membre d'équipe par ID"""
        statement = select(TeamMember).where(
            TeamMember.id == team_member_id,
            TeamMember.deleted_at.is_(None)
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_by_user_id(self, user_id: int) -> Optional[TeamMember]:
        """Récupère un membre d'équipe par user_id"""
        statement = select(TeamMember).where(
            TeamMember.user_id == user_id,
            TeamMember.deleted_at.is_(None)
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_by_company_id(self, company_id: int) -> List[TeamMember]:
        """Récupère tous les membres d'équipe d'une entreprise"""
        statement = select(TeamMember).where(
            TeamMember.company_id == company_id,
            TeamMember.deleted_at.is_(None)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    async def get_by_company_id_and_role(self, company_id: int, role: str) -> List[TeamMember]:
        """Récupère les membres d'équipe d'une entreprise par rôle"""
        statement = select(TeamMember).where(
            TeamMember.company_id == company_id,
            TeamMember.role_in_company == role,
            TeamMember.deleted_at.is_(None)
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    async def create(self, team_member: TeamMember) -> TeamMember:
        """Crée un nouveau membre d'équipe"""
        self.session.add(team_member)
        await self.session.commit()
        await self.session.refresh(team_member)
        return team_member
    
    async def update(self, team_member: TeamMember) -> TeamMember:
        """Met à jour un membre d'équipe"""
        team_member.updated_at = datetime.utcnow()
        self.session.add(team_member)
        await self.session.commit()
        await self.session.refresh(team_member)
        return team_member


class InvitationRepository:
    """Repository pour les opérations sur les invitations"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_token(self, token: str) -> Optional[Invitation]:
        """Récupère une invitation par token"""
        statement = select(Invitation).where(Invitation.token == token)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_by_email_and_company(self, email: str, company_id: int) -> Optional[Invitation]:
        """Récupère une invitation par email et company"""
        statement = select(Invitation).where(
            Invitation.email == email,
            Invitation.company_id == company_id,
            Invitation.status == "pending"
        ).order_by(Invitation.created_at.desc())
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()
    
    async def get_by_company_id(self, company_id: int) -> List[Invitation]:
        """Récupère toutes les invitations d'une entreprise"""
        statement = select(Invitation).where(
            Invitation.company_id == company_id
        ).order_by(Invitation.created_at.desc())
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    async def create(self, invitation: Invitation) -> Invitation:
        """Crée une nouvelle invitation"""
        self.session.add(invitation)
        await self.session.commit()
        await self.session.refresh(invitation)
        return invitation
    
    async def update(self, invitation: Invitation) -> Invitation:
        """Met à jour une invitation"""
        self.session.add(invitation)
        await self.session.commit()
        await self.session.refresh(invitation)
        return invitation

