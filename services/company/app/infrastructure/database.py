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
        
        # Migration: Ajouter les champs de contact du référent à la table companies si elles n'existent pas
        await migrate_add_company_contact_fields(conn)
        
        # Migration: Ajouter deleted_at aux tables si elles n'existent pas
        await migrate_add_deleted_at_columns(conn)


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


async def migrate_add_company_contact_fields(conn):
    """Migration: Ajoute les champs de contact du référent à la table companies si elles n'existent pas"""
    from sqlalchemy import text, inspect
    
    # Vérifier si les colonnes existent déjà
    def check_and_add_columns(sync_conn):
        inspector = inspect(sync_conn)
        try:
            columns = [col['name'] for col in inspector.get_columns('companies')]
            
            # Ajouter contact_first_name si elle n'existe pas
            if 'contact_first_name' not in columns:
                sync_conn.execute(text("ALTER TABLE companies ADD COLUMN contact_first_name VARCHAR(100)"))
                print("✅ Migration: Colonne contact_first_name ajoutée à la table companies")
            
            # Ajouter contact_last_name si elle n'existe pas
            if 'contact_last_name' not in columns:
                sync_conn.execute(text("ALTER TABLE companies ADD COLUMN contact_last_name VARCHAR(100)"))
                print("✅ Migration: Colonne contact_last_name ajoutée à la table companies")
            
            # Ajouter contact_email si elle n'existe pas
            if 'contact_email' not in columns:
                sync_conn.execute(text("ALTER TABLE companies ADD COLUMN contact_email VARCHAR(255)"))
                print("✅ Migration: Colonne contact_email ajoutée à la table companies")
            
            # Ajouter contact_phone si elle n'existe pas
            if 'contact_phone' not in columns:
                sync_conn.execute(text("ALTER TABLE companies ADD COLUMN contact_phone VARCHAR(50)"))
                print("✅ Migration: Colonne contact_phone ajoutée à la table companies")
            
            # Ajouter contact_function si elle n'existe pas
            if 'contact_function' not in columns:
                sync_conn.execute(text("ALTER TABLE companies ADD COLUMN contact_function VARCHAR(100)"))
                print("✅ Migration: Colonne contact_function ajoutée à la table companies")
        except Exception as e:
            # Si la table n'existe pas encore, on ignore l'erreur (elle sera créée par create_all)
            if "does not exist" not in str(e).lower() and "duplicate column" not in str(e).lower():
                print(f"⚠️  Migration: Erreur lors de l'ajout des colonnes: {e}")
    
    await conn.run_sync(check_and_add_columns)


async def migrate_add_deleted_at_columns(conn):
    """Migration: Ajoute deleted_at aux tables companies et team_members si elles n'existent pas"""
    from sqlalchemy import text, inspect
    
    def check_and_add_columns(sync_conn):
        inspector = inspect(sync_conn)
        for table in ("companies", "team_members"):
            try:
                columns = [col['name'] for col in inspector.get_columns(table)]
                if 'deleted_at' not in columns:
                    sync_conn.execute(text(f"ALTER TABLE {table} ADD COLUMN deleted_at TIMESTAMP"))
                    print(f"✅ Migration: Colonne deleted_at ajoutée à la table {table}")
            except Exception as e:
                if "does not exist" not in str(e).lower() and "duplicate column" not in str(e).lower():
                    print(f"⚠️  Migration: Erreur lors de l'ajout de deleted_at à {table}: {e}")
    
    await conn.run_sync(check_and_add_columns)

