"""Add company_logo_url to Experience model

Revision ID: 127a71302590
Revises: 5b93d2c4de21
Create Date: 2026-01-17 16:09:31.294726

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '127a71302590'
down_revision: Union[str, None] = '5b93d2c4de21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ajouter le champ company_logo_url à la table experiences
    op.add_column('experiences', sa.Column('company_logo_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    # Retirer le champ company_logo_url de la table experiences
    op.drop_column('experiences', 'company_logo_url')

