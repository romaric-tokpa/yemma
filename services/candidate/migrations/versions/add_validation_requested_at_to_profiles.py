"""Add validation_requested_at to profiles

Revision ID: add_validation_req_at
Revises: add_profile_stats_idx
Create Date: 2026-02-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_validation_req_at"
down_revision: Union[str, None] = "add_profile_stats_idx"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "profiles",
        sa.Column("validation_requested_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("profiles", "validation_requested_at")
