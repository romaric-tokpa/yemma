"""
Configuration de la base de données
"""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlmodel import SQLModel

from app.core.config import settings

# Engine async avec résilience : pool_pre_ping vérifie les connexions avant usage, timeout pour éviter blocages
db_url = settings.DATABASE_URL
if not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    connect_args={"timeout": 10},
    pool_size=5,
    max_overflow=10,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncSession:
    """Dependency pour obtenir une session de base de données"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def migrate_add_job_offer_company_id(conn):
    """Migration: Ajoute company_id à job_offers si elle n'existe pas"""
    from sqlalchemy import inspect

    def check_and_add(sync_conn):
        inspector = inspect(sync_conn)
        try:
            columns = [col['name'] for col in inspector.get_columns('job_offers')]
            if 'company_id' not in columns:
                sync_conn.execute(text("ALTER TABLE job_offers ADD COLUMN company_id INTEGER"))
                print("✅ Migration: Colonne company_id ajoutée à job_offers")
        except Exception as e:
            if "does not exist" not in str(e).lower() and "duplicate column" not in str(e).lower():
                print(f"⚠️  Migration job_offers company_id: {e}")

    await conn.run_sync(check_and_add)


async def migrate_add_validation_requested_at(conn):
    """Migration: Ajoute validation_requested_at à profiles si elle n'existe pas"""
    from sqlalchemy import inspect

    def check_and_add(sync_conn):
        inspector = inspect(sync_conn)
        try:
            columns = [col['name'] for col in inspector.get_columns('profiles')]
            if 'validation_requested_at' not in columns:
                sync_conn.execute(text("ALTER TABLE profiles ADD COLUMN validation_requested_at TIMESTAMP"))
                print("✅ Migration: Colonne validation_requested_at ajoutée à profiles")
        except Exception as e:
            if "does not exist" not in str(e).lower() and "duplicate column" not in str(e).lower():
                print(f"⚠️  Migration profiles validation_requested_at: {e}")

    await conn.run_sync(check_and_add)


async def init_db():
    """Initialise la base de données (création des tables)"""
    async with engine.begin() as conn:
        # Import des modèles pour que SQLModel les enregistre
        from app.domain.models import Profile, Experience, Education, Certification, Skill, JobPreference, JobOffer, Application

        # Création des tables
        await conn.run_sync(SQLModel.metadata.create_all)
        await migrate_add_job_offer_company_id(conn)
        await migrate_add_validation_requested_at(conn)
