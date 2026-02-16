"""Add job_offers and applications tables (effet Leurre)

Revision ID: job_offers_applications
Revises: hrflow_profile_key
Create Date: 2026-02-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "job_offers_applications"
down_revision: Union[str, None] = "hrflow_profile_key"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "job_offers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("location", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("contract_type", sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column("salary_range", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
        sa.Column("requirements", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("DRAFT", "PUBLISHED", "CLOSED", name="jobstatus"), nullable=False, server_default="DRAFT"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_job_offers_status"), "job_offers", ["status"], unique=False)

    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("candidate_id", sa.Integer(), nullable=False),
        sa.Column("job_offer_id", sa.Integer(), nullable=False),
        sa.Column("status", sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False, server_default="PENDING"),
        sa.Column("applied_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("cover_letter", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["candidate_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["job_offer_id"], ["job_offers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_applications_candidate_id"), "applications", ["candidate_id"], unique=False)
    op.create_index(op.f("ix_applications_job_offer_id"), "applications", ["job_offer_id"], unique=False)
    # Contrainte d'unicité : un candidat ne peut postuler qu'une fois par offre
    op.create_unique_constraint(
        "uq_applications_candidate_job",
        "applications",
        ["candidate_id", "job_offer_id"],
    )


def downgrade() -> None:
    op.drop_table("applications")
    op.drop_index(op.f("ix_job_offers_status"), table_name="job_offers")
    op.drop_table("job_offers")
    op.execute("DROP TYPE IF EXISTS jobstatus")
