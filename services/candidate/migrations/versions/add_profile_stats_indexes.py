"""Add indexes for profile stats queries

Revision ID: add_profile_stats_idx
Revises: add_rejection_reason_app
Create Date: 2026-02-17

Optimise les requêtes /profiles/stats, /profiles/stats/by-sector, /profiles/stats/by-period
"""
from typing import Sequence, Union

from alembic import op


revision: str = "add_profile_stats_idx"
down_revision: Union[str, None] = "add_rejection_reason_app"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Index pour filtrer deleted_at (utilisé dans toutes les stats)
    op.create_index(
        "ix_profiles_deleted_at",
        "profiles",
        ["deleted_at"],
        unique=False,
    )
    # Index composite pour stats par statut (deleted_at + status)
    op.create_index(
        "ix_profiles_deleted_status",
        "profiles",
        ["deleted_at", "status"],
        unique=False,
    )
    # Index composite pour stats par secteur (deleted_at + sector + status)
    op.create_index(
        "ix_profiles_deleted_sector_status",
        "profiles",
        ["deleted_at", "sector", "status"],
        unique=False,
    )
    # Index pour stats par période - created_at
    op.create_index(
        "ix_profiles_created_at",
        "profiles",
        ["deleted_at", "created_at"],
        unique=False,
    )
    # Index pour stats par période - validated_at
    op.create_index(
        "ix_profiles_validated_at",
        "profiles",
        ["deleted_at", "validated_at"],
        unique=False,
    )
    # Index pour stats par période - rejected_at
    op.create_index(
        "ix_profiles_rejected_at",
        "profiles",
        ["deleted_at", "rejected_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_profiles_rejected_at", table_name="profiles")
    op.drop_index("ix_profiles_validated_at", table_name="profiles")
    op.drop_index("ix_profiles_created_at", table_name="profiles")
    op.drop_index("ix_profiles_deleted_sector_status", table_name="profiles")
    op.drop_index("ix_profiles_deleted_status", table_name="profiles")
    op.drop_index("ix_profiles_deleted_at", table_name="profiles")
