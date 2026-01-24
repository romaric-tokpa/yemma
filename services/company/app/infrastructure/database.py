"""
Configuration de la base de données
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlmodel import SQLModel

from app.core.config import settings

# Engine async
db_url = settings.DATABASE_URL
if not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    future=True,
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
        from app.domain.models import Company, TeamMember, Invitation
        
        # Création des tables
        await conn.run_sync(SQLModel.metadata.create_all)
        
        # Migration: Ajouter first_name et last_name à la table invitations si elles n'existent pas
        await migrate_add_invitation_names(conn)


async def migrate_add_invitation_names(conn):
    """Migration: Ajoute first_name et last_name à la table invitations si elles n'existent pas"""
    from sqlalchemy import text, inspect
    
    # Vérifier si les colonnes existent déjà
    # Utiliser run_sync pour exécuter la fonction de synchronisation
    def check_and_add_columns(sync_conn):
        inspector = inspect(sync_conn)
        try:
            columns = [col['name'] for col in inspector.get_columns('invitations')]
            
            # Ajouter first_name si elle n'existe pas
            if 'first_name' not in columns:
                sync_conn.execute(text("ALTER TABLE invitations ADD COLUMN first_name VARCHAR(100)"))
                print("✅ Migration: Colonne first_name ajoutée à la table invitations")
            
            # Ajouter last_name si elle n'existe pas
            if 'last_name' not in columns:
                sync_conn.execute(text("ALTER TABLE invitations ADD COLUMN last_name VARCHAR(100)"))
                print("✅ Migration: Colonne last_name ajoutée à la table invitations")
        except Exception as e:
            # Si la table n'existe pas encore, on ignore l'erreur (elle sera créée par create_all)
            if "does not exist" not in str(e).lower() and "duplicate column" not in str(e).lower():
                print(f"⚠️  Migration: Erreur lors de l'ajout des colonnes: {e}")
    
    await conn.run_sync(check_and_add_columns)

