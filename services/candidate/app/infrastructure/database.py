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


async def init_db():
    """Initialise la base de données (création des tables)"""
    async with engine.begin() as conn:
        # Import des modèles pour que SQLModel les enregistre
        from app.domain.models import Profile, Experience, Education, Certification, Skill, JobPreference, JobOffer, Application
        
        # Création des tables
        await conn.run_sync(SQLModel.metadata.create_all)
