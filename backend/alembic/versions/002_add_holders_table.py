"""Add holders table.

Revision ID: 002
Revises: 001
Create Date: 2024-01-20 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create holders table."""
    op.create_table(
        "holders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("default_shares", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_holder_name"),
        sa.CheckConstraint(
            "default_shares IS NULL OR default_shares > 0",
            name="chk_default_shares_positive",
        ),
    )

    # Create indexes
    op.create_index("idx_holders_name", "holders", ["name"])
    op.create_index("idx_holders_active", "holders", ["is_active"])


def downgrade() -> None:
    """Drop holders table."""
    op.drop_index("idx_holders_active", table_name="holders")
    op.drop_index("idx_holders_name", table_name="holders")
    op.drop_table("holders")
