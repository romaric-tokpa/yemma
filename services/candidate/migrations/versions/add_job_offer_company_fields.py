"""Add company and external application fields to job_offers

Revision ID: job_offer_company_fields
Revises: job_offers_applications
Create Date: 2026-02-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "job_offer_company_fields"
down_revision: Union[str, None] = "job_offers_applications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("job_offers", sa.Column("company_name", sa.String(255), nullable=True))
    op.add_column("job_offers", sa.Column("company_logo_url", sa.String(500), nullable=True))
    op.add_column("job_offers", sa.Column("external_application_url", sa.String(500), nullable=True))
    op.add_column("job_offers", sa.Column("application_email", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("job_offers", "application_email")
    op.drop_column("job_offers", "external_application_url")
    op.drop_column("job_offers", "company_logo_url")
    op.drop_column("job_offers", "company_name")
