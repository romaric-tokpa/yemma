"""Add oauth_provider and oauth_id to users for OAuth login

Revision ID: 002
Revises: 001
Create Date: 2025-02-11

"""
from alembic import op
import sqlalchemy as sa


revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'users' not in inspector.get_table_names():
        return
    columns = [c['name'] for c in inspector.get_columns('users')]
    if 'oauth_provider' not in columns:
        op.add_column('users', sa.Column('oauth_provider', sa.String(50), nullable=True))
    if 'oauth_id' not in columns:
        op.add_column('users', sa.Column('oauth_id', sa.String(255), nullable=True))
    # Rendre hashed_password nullable pour les comptes OAuth
    try:
        op.alter_column(
            'users',
            'hashed_password',
            existing_type=sa.String(255),
            nullable=True,
        )
    except Exception:
        pass  # Ignorer si déjà nullable


def downgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('users')]
    if 'oauth_id' in columns:
        op.drop_column('users', 'oauth_id')
    if 'oauth_provider' in columns:
        op.drop_column('users', 'oauth_provider')
