"""Add sector to job_offers

Revision ID: add_sector_job_offers
Revises: job_offer_company_fields
Create Date: 2026-02-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_sector_job_offers"
down_revision: Union[str, None] = "job_offer_company_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("job_offers", sa.Column("sector", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("job_offers", "sector")
