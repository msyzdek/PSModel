"""Repository for Holder data access operations."""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.holder import Holder
from app.models.holder_allocation import HolderAllocation


class HolderRepository:
    """Repository for managing Holder persistence."""

    def __init__(self, db: Session) -> None:
        """
        Initialize repository with database session.

        Args:
            db: SQLAlchemy database session

        """
        self.db = db

    def save(self, holder: Holder) -> Holder:
        """
        Save a Holder to the database.

        Args:
            holder: Holder instance to save

        Returns:
            Holder: Saved holder with updated id

        """
        self.db.add(holder)
        self.db.commit()
        self.db.refresh(holder)
        return holder

    def find_by_id(self, holder_id: int) -> Optional[Holder]:
        """
        Find a Holder by its ID.

        Args:
            holder_id: ID of the holder to find

        Returns:
            Optional[Holder]: Holder if found, None otherwise

        """
        return self.db.query(Holder).filter(Holder.id == holder_id).first()

    def find_by_name(self, name: str) -> Optional[Holder]:
        """
        Find a Holder by name.

        Args:
            name: Name of the holder to find

        Returns:
            Optional[Holder]: Holder if found, None otherwise

        """
        return self.db.query(Holder).filter(Holder.name == name).first()

    def find_all(self, active_only: bool = True) -> list[Holder]:
        """
        Find all Holders, optionally filtering by active status.

        Args:
            active_only: If True, return only active holders (default: True)

        Returns:
            list[Holder]: List of holders ordered by name

        """
        query = self.db.query(Holder)
        
        if active_only:
            query = query.filter(Holder.is_active == True)  # noqa: E712
        
        return query.order_by(Holder.name).all()

    def update(self, holder: Holder) -> Holder:
        """
        Update a Holder in the database.

        Args:
            holder: Holder instance with updated values

        Returns:
            Holder: Updated holder

        """
        self.db.commit()
        self.db.refresh(holder)
        return holder

    def delete(self, holder_id: int) -> None:
        """
        Delete a Holder by its ID.

        Args:
            holder_id: ID of the holder to delete

        """
        holder = self.db.query(Holder).filter(Holder.id == holder_id).first()
        if holder:
            self.db.delete(holder)
            self.db.commit()

    def count_allocations(self, holder_id: int) -> int:
        """
        Count the number of allocations (period participations) for a holder.

        Args:
            holder_id: ID of the holder

        Returns:
            int: Number of allocations for the holder

        """
        return (
            self.db.query(func.count(HolderAllocation.id))
            .filter(HolderAllocation.holder_id == holder_id)
            .scalar()
            or 0
        )
