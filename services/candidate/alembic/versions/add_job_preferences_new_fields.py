"""Add new job preferences fields (contract_types, remote_preference, etc.)

Revision ID: job_pref_new_fields
Revises: abc123def456
Create Date: 2026-02-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

# revision identifiers, used by Alembic.
revision = 'job_pref_new_fields'
down_revision = 'abc123def456'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ajouter les nouvelles colonnes à job_preferences
    op.add_column('job_preferences', sa.Column('contract_types', ARRAY(sa.String()), nullable=True))
    op.add_column('job_preferences', sa.Column('preferred_locations', sa.String(500), nullable=True))
    op.add_column('job_preferences', sa.Column('remote_preference', sa.String(50), nullable=True))
    op.add_column('job_preferences', sa.Column('willing_to_relocate', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    op.drop_column('job_preferences', 'willing_to_relocate')
    op.drop_column('job_preferences', 'remote_preference')
    op.drop_column('job_preferences', 'preferred_locations')
    op.drop_column('job_preferences', 'contract_types')
