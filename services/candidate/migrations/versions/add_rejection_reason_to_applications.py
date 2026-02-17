"""Add rejection_reason to applications

Revision ID: add_rejection_reason_app
Revises: add_job_offer_metrics
Create Date: 2026-02-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_rejection_reason_app"
down_revision: Union[str, None] = "add_job_offer_metrics"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "applications",
        sa.Column("rejection_reason", sa.String(length=2000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("applications", "rejection_reason")
