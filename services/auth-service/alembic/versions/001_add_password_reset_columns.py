"""Add password_reset_token and password_reset_expires to users

Revision ID: 001
Revises: 
Create Date: 2025-02-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add password_reset columns to users table if they don't exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'users' not in inspector.get_table_names():
        return  # Table créée par init_db avec le modèle complet
    columns = [c['name'] for c in inspector.get_columns('users')]
    if 'password_reset_token' not in columns:
        op.add_column('users', sa.Column('password_reset_token', sa.String(255), nullable=True))
    if 'password_reset_expires' not in columns:
        op.add_column('users', sa.Column('password_reset_expires', sa.DateTime(), nullable=True))


def downgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('users')]
    if 'password_reset_expires' in columns:
        op.drop_column('users', 'password_reset_expires')
    if 'password_reset_token' in columns:
        op.drop_column('users', 'password_reset_token')
