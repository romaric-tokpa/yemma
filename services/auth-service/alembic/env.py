"""
Alembic environment configuration
"""
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Import des modèles pour qu'Alembic les détecte
from app.domain.models import User, Role, UserRoleLink, RefreshToken, AdminInvitationToken
from sqlmodel import SQLModel
from app.core.config import settings

# this is the Alembic Config object
config = context.config

# Override sqlalchemy.url with settings (Alembic utilise sync, donc on enlève asyncpg)
db_url = settings.DATABASE_URL.replace("+asyncpg", "")
config.set_main_option("sqlalchemy.url", db_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table="alembic_version_auth",
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        # Table de version séparée pour éviter conflit avec candidate/company sur DB partagée
        version_table="alembic_version_auth",
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (sync - Alembic utilise psycopg2)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

