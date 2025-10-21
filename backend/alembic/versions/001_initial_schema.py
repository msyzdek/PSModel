"""Initial schema for monthly periods and holder allocations.

Revision ID: 001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create monthly_periods and holder_allocations tables."""
    # Create monthly_periods table
    op.create_table(
        "monthly_periods",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("net_income_qb", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("ps_addback", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("owner_draws", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("uncollectible", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("bad_debt", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("tax_optimization", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("adjusted_pool", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("total_shares", sa.Integer(), nullable=False),
        sa.Column("rounding_delta", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("year", "month", name="uq_year_month"),
    )

    # Create holder_allocations table
    op.create_table(
        "holder_allocations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("period_id", sa.Integer(), nullable=False),
        sa.Column("holder_name", sa.String(length=255), nullable=False),
        sa.Column("shares", sa.Integer(), nullable=False),
        sa.Column("personal_charges", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("carry_forward_in", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("gross_allocation", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("net_payout", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("carry_forward_out", sa.DECIMAL(precision=12, scale=2), nullable=False),
        sa.Column("received_rounding_adjustment", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(
            ["period_id"], ["monthly_periods.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Drop holder_allocations and monthly_periods tables."""
    op.drop_table("holder_allocations")
    op.drop_table("monthly_periods")
