"""Add hrflow_profile_key to profiles (Profile Asking / CvGPT)

Revision ID: hrflow_profile_key
Revises: job_pref_new_fields
Create Date: 2026-02-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "hrflow_profile_key"
down_revision: Union[str, None] = "job_pref_new_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "profiles",
        sa.Column("hrflow_profile_key", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("profiles", "hrflow_profile_key")
