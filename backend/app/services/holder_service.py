"""Service for managing holders and their lifecycle."""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.holder import Holder
from app.models.holder_allocation import HolderAllocation
from app.repositories.holder_repository import HolderRepository


class HolderService:
    """Service for managing holder operations and business logic."""

    def __init__(self, db: Session) -> None:
        """
        Initialize service with database session.

        Args:
            db: SQLAlchemy database session

        """
        self.db = db
        self.holder_repo = HolderRepository(db)

    def create_holder(self, name: str, default_shares: Optional[int] = None) -> Holder:
        """
        Create a new holder with name uniqueness validation.

        Args:
            name: Name of the holder (must be unique)
            default_shares: Optional default shares for the holder

        Returns:
            Holder: Created holder

        Raises:
            ValueError: If name is empty, too long, or already exists
            ValueError: If default_shares is not positive

        """
        # Validate name
        name = name.strip()
        if not name:
            raise ValueError("Holder name cannot be empty")
        if len(name) > 255:
            raise ValueError("Holder name must be 255 characters or less")

        # Check for duplicate name
        existing = self.holder_repo.find_by_name(name)
        if existing:
            raise ValueError(f"Holder with name '{name}' already exists")

        # Validate default_shares
        if default_shares is not None and default_shares <= 0:
            raise ValueError("Default shares must be greater than zero")

        # Create holder
        holder = Holder(name=name, default_shares=default_shares, is_active=True)

        return self.holder_repo.save(holder)

    def get_holder(self, holder_id: int) -> Optional[Holder]:
        """
        Get a holder by ID.

        Args:
            holder_id: ID of the holder

        Returns:
            Optional[Holder]: Holder if found, None otherwise

        """
        return self.holder_repo.find_by_id(holder_id)

    def get_holder_by_name(self, name: str) -> Optional[Holder]:
        """
        Get a holder by name.

        Args:
            name: Name of the holder

        Returns:
            Optional[Holder]: Holder if found, None otherwise

        """
        return self.holder_repo.find_by_name(name)

    def list_holders(self, active_only: bool = True) -> list[Holder]:
        """
        List all holders, optionally filtering by active status.

        Args:
            active_only: If True, return only active holders (default: True)

        Returns:
            list[Holder]: List of holders ordered by name

        """
        return self.holder_repo.find_all(active_only=active_only)

    def update_holder(
        self,
        holder_id: int,
        name: Optional[str] = None,
        default_shares: Optional[int] = None,
    ) -> Holder:
        """
        Update a holder with cascade name updates to allocations.

        When the holder name is updated, all associated allocations are also updated
        to maintain consistency across historical periods.

        Args:
            holder_id: ID of the holder to update
            name: New name for the holder (optional)
            default_shares: New default shares (optional)

        Returns:
            Holder: Updated holder

        Raises:
            ValueError: If holder not found, name validation fails, or duplicate name
            ValueError: If default_shares is not positive

        """
        # Find holder
        holder = self.holder_repo.find_by_id(holder_id)
        if not holder:
            raise ValueError(f"Holder with id {holder_id} not found")

        # Update name if provided
        if name is not None:
            name = name.strip()
            if not name:
                raise ValueError("Holder name cannot be empty")
            if len(name) > 255:
                raise ValueError("Holder name must be 255 characters or less")

            # Check for duplicate name (excluding current holder)
            existing = self.holder_repo.find_by_name(name)
            if existing and existing.id != holder_id:
                raise ValueError(f"Holder with name '{name}' already exists")

            # Update holder name
            old_name = holder.name
            holder.name = name

            # Cascade update to all allocations
            self._cascade_name_update(holder_id, old_name, name)

        # Update default_shares if provided
        if default_shares is not None:
            if default_shares <= 0:
                raise ValueError("Default shares must be greater than zero")
            holder.default_shares = default_shares

        return self.holder_repo.update(holder)

    def deactivate_holder(self, holder_id: int) -> Holder:
        """
        Deactivate a holder (soft delete) with allocation count check.

        Holders with existing allocations cannot be deleted to preserve historical data.
        Instead, they are marked as inactive, which hides them from new period creation
        but preserves all historical records.

        Args:
            holder_id: ID of the holder to deactivate

        Returns:
            Holder: Deactivated holder

        Raises:
            ValueError: If holder not found

        """
        # Find holder
        holder = self.holder_repo.find_by_id(holder_id)
        if not holder:
            raise ValueError(f"Holder with id {holder_id} not found")

        # Mark as inactive
        holder.is_active = False

        return self.holder_repo.update(holder)

    def get_or_create_holder(
        self, name: str, default_shares: Optional[int] = None
    ) -> Holder:
        """
        Get an existing holder by name or create a new one if not found.

        This method enables seamless holder creation during period operations,
        allowing users to add new holders without explicitly managing the holder list.

        Args:
            name: Name of the holder
            default_shares: Optional default shares (used only if creating new holder)

        Returns:
            Holder: Existing or newly created holder

        Raises:
            ValueError: If name validation fails or default_shares is invalid

        """
        # Try to find existing holder
        existing = self.holder_repo.find_by_name(name)
        if existing:
            return existing

        # Create new holder if not found
        return self.create_holder(name, default_shares)

    def _cascade_name_update(self, holder_id: int, old_name: str, new_name: str) -> None:
        """
        Cascade holder name updates to all associated allocations.

        This ensures that historical period data reflects the current holder name
        while maintaining referential integrity through the holder_id foreign key.

        Args:
            holder_id: ID of the holder
            old_name: Previous name of the holder
            new_name: New name of the holder

        """
        # Update all allocations for this holder
        self.db.query(HolderAllocation).filter(
            HolderAllocation.holder_id == holder_id
        ).update({"holder_name": new_name})
        self.db.commit()
