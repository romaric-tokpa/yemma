"""Add view_count and register_click_count to job_offers

Revision ID: add_job_offer_metrics
Revises: add_archived_job_status
Create Date: 2026-02-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_job_offer_metrics"
down_revision: Union[str, None] = "add_archived_job_status"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "job_offers",
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "job_offers",
        sa.Column("register_click_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("job_offers", "register_click_count")
    op.drop_column("job_offers", "view_count")
