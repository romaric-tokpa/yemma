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
        
        # Vérifier le plan Pro (par nom pour éviter les conflits)
        statement = select(Plan).where(Plan.name == "Pro")
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
        
        # Vérifier le plan Enterprise (par nom pour éviter les conflits)
        statement = select(Plan).where(Plan.name == "Enterprise")
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
        
        # Vérifier le plan Essentiel (adapté au marché ivoirien)
        statement = select(Plan).where(Plan.name == "Essentiel")
        result = await session.execute(statement)
        essentiel = result.scalar_one_or_none()
        
        if not essentiel:
            # Créer le plan Essentiel - adapté au marché ivoirien
            # Prix : 15 000 FCFA/mois (≈ 23 EUR) ou 150 000 FCFA/an (≈ 229 EUR)
            # Conversion : 1 EUR ≈ 655 FCFA
            essentiel = Plan(
                name="Essentiel",
                plan_type=PlanType.PRO,  # Utiliser PRO comme type de base
                description="Plan essentiel adapté au marché ivoirien - Idéal pour les petites et moyennes entreprises",
                price_monthly=22.90,  # ≈ 15 000 FCFA
                price_yearly=228.50,  # ≈ 150 000 FCFA (économise 20%)
                max_profile_views=50,  # 50 consultations par mois
                unlimited_search=True,
                document_access=True,
                multi_accounts=False,
                is_active=True,  # S'assurer que le plan est actif
            )
            session.add(essentiel)
            print(f"✅ Plan 'Essentiel' créé avec succès")
        else:
            # S'assurer que le plan existant est actif
            if not essentiel.is_active:
                essentiel.is_active = True
                print(f"✅ Plan 'Essentiel' réactivé (ID: {essentiel.id})")
            else:
                print(f"ℹ️ Plan 'Essentiel' existe déjà et est actif (ID: {essentiel.id})")
        
        await session.commit()
        print(f"✅ Seed des plans terminé. Plans créés/vérifiés: Freemium, Pro, Enterprise, Essentiel")

