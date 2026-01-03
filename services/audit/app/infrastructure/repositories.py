"""
Repositories pour l'accès aux données
"""
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from sqlalchemy.sql import text

from app.domain.models import AccessLog


class AccessLogRepository:
    """Repository pour les opérations sur les logs d'accès"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, access_log: AccessLog) -> AccessLog:
        """Crée un nouveau log d'accès"""
        self.session.add(access_log)
        await self.session.commit()
        await self.session.refresh(access_log)
        return access_log
    
    async def get_by_id(self, log_id: int) -> Optional[AccessLog]:
        """Récupère un log par ID"""
        result = await self.session.get(AccessLog, log_id)
        return result
    
    async def get_by_candidate_id(
        self,
        candidate_id: int,
        limit: int = 100,
        offset: int = 0
    ) -> List[AccessLog]:
        """Récupère les logs d'accès pour un candidat"""
        statement = select(AccessLog).where(
            AccessLog.candidate_id == candidate_id
        ).order_by(desc(AccessLog.accessed_at)).limit(limit).offset(offset)
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    async def count_by_candidate_id(self, candidate_id: int) -> int:
        """Compte le nombre total de logs pour un candidat"""
        statement = select(func.count(AccessLog.id)).where(
            AccessLog.candidate_id == candidate_id
        )
        result = await self.session.execute(statement)
        return result.scalar_one() or 0
    
    async def get_companies_by_candidate_id(
        self,
        candidate_id: int,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict]:
        """
        Récupère la liste des entreprises qui ont consulté un candidat (RGPD)
        
        Retourne un résumé par entreprise avec :
        - company_id
        - company_name (nom uniquement)
        - access_count (nombre d'accès)
        - last_access (dernier accès)
        
        Args:
            candidate_id: ID du candidat
            limit: Nombre maximum d'entreprises à retourner
            offset: Décalage pour la pagination
        
        Returns:
            Liste de dictionnaires avec les informations des entreprises
        """
        statement = select(
            AccessLog.company_id,
            AccessLog.company_name,
            func.count(AccessLog.id).label("access_count"),
            func.max(AccessLog.accessed_at).label("last_access")
        ).where(
            AccessLog.candidate_id == candidate_id
        ).group_by(
            AccessLog.company_id,
            AccessLog.company_name
        ).order_by(
            desc(func.max(AccessLog.accessed_at))
        ).limit(limit).offset(offset)
        
        result = await self.session.execute(statement)
        rows = result.all()
        
        return [
            {
                "company_id": row.company_id,
                "company_name": row.company_name,
                "access_count": row.access_count,
                "last_access": row.last_access
            }
            for row in rows
        ]
    
    async def count_unique_companies_by_candidate_id(self, candidate_id: int) -> int:
        """Compte le nombre d'entreprises uniques qui ont consulté un candidat"""
        statement = select(func.count(func.distinct(AccessLog.company_id))).where(
            AccessLog.candidate_id == candidate_id
        )
        result = await self.session.execute(statement)
        return result.scalar_one() or 0
    
    async def get_by_recruiter_id(
        self,
        recruiter_id: int,
        limit: int = 100,
        offset: int = 0
    ) -> List[AccessLog]:
        """Récupère les logs d'accès pour un recruteur"""
        statement = select(AccessLog).where(
            AccessLog.recruiter_id == recruiter_id
        ).order_by(desc(AccessLog.accessed_at)).limit(limit).offset(offset)
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    async def get_by_company_id(
        self,
        company_id: int,
        limit: int = 100,
        offset: int = 0
    ) -> List[AccessLog]:
        """Récupère les logs d'accès pour une entreprise"""
        statement = select(AccessLog).where(
            AccessLog.company_id == company_id
        ).order_by(desc(AccessLog.accessed_at)).limit(limit).offset(offset)
        result = await self.session.execute(statement)
        return list(result.scalars().all())
    
    async def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> tuple[List[AccessLog], int]:
        """Récupère tous les logs avec pagination et filtres"""
        statement = select(AccessLog)
        count_statement = select(func.count(AccessLog.id))
        
        # Filtres de date
        if start_date:
            statement = statement.where(AccessLog.accessed_at >= start_date)
            count_statement = count_statement.where(AccessLog.accessed_at >= start_date)
        if end_date:
            statement = statement.where(AccessLog.accessed_at <= end_date)
            count_statement = count_statement.where(AccessLog.accessed_at <= end_date)
        
        # Pagination
        statement = statement.order_by(desc(AccessLog.accessed_at)).limit(limit).offset(offset)
        
        result = await self.session.execute(statement)
        count_result = await self.session.execute(count_statement)
        
        return list(result.scalars().all()), count_result.scalar_one()
    
    async def get_stats(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """Récupère les statistiques d'accès"""
        # Total d'accès
        total_statement = select(func.count(AccessLog.id))
        if start_date:
            total_statement = total_statement.where(AccessLog.accessed_at >= start_date)
        if end_date:
            total_statement = total_statement.where(AccessLog.accessed_at <= end_date)
        total_result = await self.session.execute(total_statement)
        total_accesses = total_result.scalar_one()
        
        # Recruteurs uniques
        unique_recruiters_statement = select(func.count(func.distinct(AccessLog.recruiter_id)))
        if start_date:
            unique_recruiters_statement = unique_recruiters_statement.where(AccessLog.accessed_at >= start_date)
        if end_date:
            unique_recruiters_statement = unique_recruiters_statement.where(AccessLog.accessed_at <= end_date)
        unique_recruiters_result = await self.session.execute(unique_recruiters_statement)
        unique_recruiters = unique_recruiters_result.scalar_one()
        
        # Candidats uniques
        unique_candidates_statement = select(func.count(func.distinct(AccessLog.candidate_id)))
        if start_date:
            unique_candidates_statement = unique_candidates_statement.where(AccessLog.accessed_at >= start_date)
        if end_date:
            unique_candidates_statement = unique_candidates_statement.where(AccessLog.accessed_at <= end_date)
        unique_candidates_result = await self.session.execute(unique_candidates_statement)
        unique_candidates = unique_candidates_result.scalar_one()
        
        # Accès par date
        accesses_by_date_statement = select(
            func.date(AccessLog.accessed_at).label("date"),
            func.count(AccessLog.id).label("count")
        ).group_by(func.date(AccessLog.accessed_at))
        if start_date:
            accesses_by_date_statement = accesses_by_date_statement.where(AccessLog.accessed_at >= start_date)
        if end_date:
            accesses_by_date_statement = accesses_by_date_statement.where(AccessLog.accessed_at <= end_date)
        accesses_by_date_result = await self.session.execute(accesses_by_date_statement)
        accesses_by_date = {str(row.date): row.count for row in accesses_by_date_result.all()}
        
        # Accès par entreprise
        accesses_by_company_statement = select(
            AccessLog.company_id,
            func.count(AccessLog.id).label("count")
        ).group_by(AccessLog.company_id)
        if start_date:
            accesses_by_company_statement = accesses_by_company_statement.where(AccessLog.accessed_at >= start_date)
        if end_date:
            accesses_by_company_statement = accesses_by_company_statement.where(AccessLog.accessed_at <= end_date)
        accesses_by_company_result = await self.session.execute(accesses_by_company_statement)
        accesses_by_company = {str(row.company_id): row.count for row in accesses_by_company_result.all()}
        
        return {
            "total_accesses": total_accesses,
            "unique_recruiters": unique_recruiters,
            "unique_candidates": unique_candidates,
            "accesses_by_date": accesses_by_date,
            "accesses_by_company": accesses_by_company,
        }


