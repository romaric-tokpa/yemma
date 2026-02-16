"""Add salary_min and salary_max to JobPreference model

Revision ID: abc123def456
Revises: 127a71302590
Create Date: 2026-01-17 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'abc123def456'
down_revision: Union[str, None] = '127a71302590'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ajouter les champs salary_min et salary_max à la table job_preferences
    op.add_column('job_preferences', sa.Column('salary_min', sa.Float(), nullable=True))
    op.add_column('job_preferences', sa.Column('salary_max', sa.Float(), nullable=True))


def downgrade() -> None:
    # Retirer les champs salary_min et salary_max de la table job_preferences
    op.drop_column('job_preferences', 'salary_max')
    op.drop_column('job_preferences', 'salary_min')
