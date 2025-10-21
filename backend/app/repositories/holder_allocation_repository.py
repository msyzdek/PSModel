"""Repository for HolderAllocation data access operations."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.holder_allocation import HolderAllocation


class HolderAllocationRepository:
    """Repository for managing HolderAllocation persistence."""

    def __init__(self, db: Session) -> None:
        """
        Initialize repository with database session.

        Args:
            db: SQLAlchemy database session

        """
        self.db = db

    def save_all(self, allocations: list[HolderAllocation]) -> list[HolderAllocation]:
        """
        Save multiple HolderAllocations to the database in a batch.

        Args:
            allocations: List of HolderAllocation instances to save

        Returns:
            list[HolderAllocation]: List of saved allocations with updated ids

        """
        self.db.add_all(allocations)
        self.db.commit()
        for allocation in allocations:
            self.db.refresh(allocation)
        return allocations

    def find_by_period(self, period_id: int) -> list[HolderAllocation]:
        """
        Find all HolderAllocations for a specific period.

        Args:
            period_id: ID of the period

        Returns:
            list[HolderAllocation]: List of allocations for the period

        """
        return (
            self.db.query(HolderAllocation)
            .filter(HolderAllocation.period_id == period_id)
            .all()
        )

    def find_carry_forwards(self, period_id: int) -> dict[str, Decimal]:
        """
        Find carry-forward amounts for all holders in a specific period.

        Args:
            period_id: ID of the period

        Returns:
            dict[str, Decimal]: Dictionary mapping holder names to carry_forward_out amounts

        """
        allocations = (
            self.db.query(HolderAllocation)
            .filter(HolderAllocation.period_id == period_id)
            .all()
        )
        return {
            allocation.holder_name: allocation.carry_forward_out for allocation in allocations
        }

    def delete_by_period(self, period_id: int) -> None:
        """
        Delete all HolderAllocations for a specific period.

        Args:
            period_id: ID of the period

        """
        self.db.query(HolderAllocation).filter(
            HolderAllocation.period_id == period_id
        ).delete()
        self.db.commit()
