"""Add ARCHIVED status to job_offers (offres expirées)

Revision ID: add_archived_job_status
Revises: add_sector_job_offers
Create Date: 2026-02-16

"""
from typing import Sequence, Union

from alembic import op


revision: str = "add_archived_job_status"
down_revision: Union[str, None] = "add_sector_job_offers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL: ajouter la valeur ARCHIVED à l'enum jobstatus
    op.execute("ALTER TYPE jobstatus ADD VALUE IF NOT EXISTS 'ARCHIVED'")


def downgrade() -> None:
    # PostgreSQL: impossible de supprimer une valeur d'enum facilement
    # On laisse l'enum tel quel pour éviter la perte de données
    pass
