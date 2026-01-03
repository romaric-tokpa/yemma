"""
Seed des données par défaut (plans)
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.models import Plan, PlanType
from app.infrastructure.database import AsyncSessionLocal


async def seed_default_plans():
    """Crée les plans par défaut s'ils n'existent pas"""
    async with AsyncSessionLocal() as session:
        # Vérifier si les plans existent déjà
        statement = select(Plan).where(Plan.plan_type == PlanType.FREEMIUM)
        result = await session.execute(statement)
        freemium = result.scalar_one_or_none()
        
        if not freemium:
            # Créer le plan Freemium
            freemium = Plan(
                name="Freemium",
                plan_type=PlanType.FREEMIUM,
                description="Plan gratuit avec accès limité",
                price_monthly=0.0,
                max_profile_views=10,  # 10 consultations par mois
                unlimited_search=False,
                document_access=False,
                multi_accounts=False,
            )
            session.add(freemium)
        
        # Vérifier le plan Pro
        statement = select(Plan).where(Plan.plan_type == PlanType.PRO)
        result = await session.execute(statement)
        pro = result.scalar_one_or_none()
        
        if not pro:
            # Créer le plan Pro
            pro = Plan(
                name="Pro",
                plan_type=PlanType.PRO,
                description="Plan professionnel avec recherche illimitée",
                price_monthly=49.99,
                price_yearly=499.99,
                max_profile_views=None,  # Illimité
                unlimited_search=True,
                document_access=False,
                multi_accounts=False,
            )
            session.add(pro)
        
        # Vérifier le plan Enterprise
        statement = select(Plan).where(Plan.plan_type == PlanType.ENTERPRISE)
        result = await session.execute(statement)
        enterprise = result.scalar_one_or_none()
        
        if not enterprise:
            # Créer le plan Enterprise
            enterprise = Plan(
                name="Enterprise",
                plan_type=PlanType.ENTERPRISE,
                description="Plan entreprise avec tous les avantages",
                price_monthly=199.99,
                price_yearly=1999.99,
                max_profile_views=None,  # Illimité
                unlimited_search=True,
                document_access=True,
                multi_accounts=True,
            )
            session.add(enterprise)
        
        await session.commit()

