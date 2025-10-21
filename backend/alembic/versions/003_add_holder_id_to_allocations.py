"""Add holder_id foreign key to holder_allocations.

Revision ID: 003
Revises: 002
Create Date: 2024-01-20 11:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add holder_id column and foreign key to holder_allocations."""
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table("holder_allocations") as batch_op:
        # Add holder_id column (nullable initially for data migration)
        batch_op.add_column(
            sa.Column("holder_id", sa.Integer(), nullable=True),
        )

        # Add foreign key constraint with RESTRICT on delete
        batch_op.create_foreign_key(
            "fk_holder_allocations_holder_id",
            "holders",
            ["holder_id"],
            ["id"],
            ondelete="RESTRICT",
        )

        # Create index on holder_id for query performance
        batch_op.create_index(
            "idx_holder_allocations_holder_id",
            ["holder_id"],
        )


def downgrade() -> None:
    """Remove holder_id column and foreign key from holder_allocations."""
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table("holder_allocations") as batch_op:
        # Drop index
        batch_op.drop_index("idx_holder_allocations_holder_id")

        # Drop foreign key constraint
        batch_op.drop_constraint(
            "fk_holder_allocations_holder_id",
            type_="foreignkey",
        )

        # Drop column
        batch_op.drop_column("holder_id")
