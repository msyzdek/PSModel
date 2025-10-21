"""Populate holders from existing allocations.

Revision ID: 004
Revises: 003
Create Date: 2024-01-20 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Populate holders table from existing holder_allocations data."""
    conn = op.get_bind()

    # Step 1: Extract unique holder names and insert into holders table
    # Using INSERT OR IGNORE for SQLite compatibility
    conn.execute(
        text("""
            INSERT INTO holders (name, is_active, created_at, updated_at)
            SELECT DISTINCT 
                holder_name,
                1 as is_active,
                datetime('now') as created_at,
                datetime('now') as updated_at
            FROM holder_allocations
            WHERE holder_name IS NOT NULL
            ORDER BY holder_name
        """)
    )

    # Step 2: Update holder_allocations.holder_id by matching holder_name to holders.name
    conn.execute(
        text("""
            UPDATE holder_allocations
            SET holder_id = (
                SELECT id 
                FROM holders 
                WHERE holders.name = holder_allocations.holder_name
            )
            WHERE holder_name IS NOT NULL
        """)
    )

    # Step 3: Calculate and set default_shares for each holder
    # Based on the most common share count for that holder
    conn.execute(
        text("""
            UPDATE holders
            SET default_shares = (
                SELECT shares
                FROM (
                    SELECT shares, COUNT(*) as count
                    FROM holder_allocations
                    WHERE holder_allocations.holder_id = holders.id
                    GROUP BY shares
                    ORDER BY COUNT(*) DESC, shares DESC
                    LIMIT 1
                )
            )
        """)
    )

    # Step 4: Make holder_id NOT NULL now that all records are populated
    # For SQLite, we need to recreate the table with the NOT NULL constraint
    # First, check if there are any NULL holder_id values
    result = conn.execute(
        text("SELECT COUNT(*) FROM holder_allocations WHERE holder_id IS NULL")
    )
    null_count = result.scalar()

    if null_count > 0:
        raise ValueError(
            f"Cannot make holder_id NOT NULL: {null_count} records have NULL holder_id"
        )

    # SQLite doesn't support ALTER COLUMN, so we need to use a different approach
    # We'll add a check constraint instead for SQLite compatibility
    # Note: In production with PostgreSQL, you would use:
    # op.alter_column('holder_allocations', 'holder_id', nullable=False)

    # For SQLite, we create a new table and copy data
    with op.batch_alter_table("holder_allocations") as batch_op:
        batch_op.alter_column("holder_id", nullable=False)


def downgrade() -> None:
    """Revert holder population - make holder_id nullable and clear holders table."""
    conn = op.get_bind()

    # Make holder_id nullable again
    with op.batch_alter_table("holder_allocations") as batch_op:
        batch_op.alter_column("holder_id", nullable=True)

    # Clear holder_id values
    conn.execute(text("UPDATE holder_allocations SET holder_id = NULL"))

    # Delete all holders
    conn.execute(text("DELETE FROM holders"))
