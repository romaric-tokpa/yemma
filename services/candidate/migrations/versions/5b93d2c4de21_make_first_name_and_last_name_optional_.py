"""Make first_name and last_name optional in Profile

Revision ID: 5b93d2c4de21
Revises: 3ba15f2c512c
Create Date: 2026-01-17 15:33:53.426645

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5b93d2c4de21'
down_revision: Union[str, None] = '3ba15f2c512c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rendre first_name et last_name optionnels (nullable)
    op.alter_column('profiles', 'first_name',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('profiles', 'last_name',
               existing_type=sa.VARCHAR(),
               nullable=True)


def downgrade() -> None:
    # Rendre first_name et last_name obligatoires (non nullable)
    # Note: Cela peut échouer si des profils ont des valeurs NULL
    op.alter_column('profiles', 'last_name',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('profiles', 'first_name',
               existing_type=sa.VARCHAR(),
               nullable=False)

