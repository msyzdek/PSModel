"""Tests for HolderService."""

import pytest
from sqlalchemy.orm import Session

from app.models.holder import Holder
from app.models.holder_allocation import HolderAllocation
from app.models.monthly_period import MonthlyPeriod
from app.services.holder_service import HolderService


class TestHolderService:
    """Test suite for HolderService."""

    def test_create_holder_success(self, db: Session) -> None:
        """Test successful holder creation."""
        service = HolderService(db)

        holder = service.create_holder("John Doe", 100)

        assert holder.id is not None
        assert holder.name == "John Doe"
        assert holder.default_shares == 100
        assert holder.is_active is True

    def test_create_holder_without_default_shares(self, db: Session) -> None:
        """Test creating holder without default shares."""
        service = HolderService(db)

        holder = service.create_holder("Jane Smith")

        assert holder.id is not None
        assert holder.name == "Jane Smith"
        assert holder.default_shares is None
        assert holder.is_active is True

    def test_create_holder_duplicate_name(self, db: Session) -> None:
        """Test that duplicate holder names are rejected."""
        service = HolderService(db)

        service.create_holder("John Doe", 100)

        with pytest.raises(ValueError, match="Holder with name 'John Doe' already exists"):
            service.create_holder("John Doe", 150)

    def test_create_holder_empty_name(self, db: Session) -> None:
        """Test that empty holder names are rejected."""
        service = HolderService(db)

        with pytest.raises(ValueError, match="Holder name cannot be empty"):
            service.create_holder("", 100)

        with pytest.raises(ValueError, match="Holder name cannot be empty"):
            service.create_holder("   ", 100)

    def test_create_holder_name_too_long(self, db: Session) -> None:
        """Test that holder names over 255 characters are rejected."""
        service = HolderService(db)

        long_name = "A" * 256

        with pytest.raises(ValueError, match="Holder name must be 255 characters or less"):
            service.create_holder(long_name, 100)

    def test_create_holder_invalid_default_shares(self, db: Session) -> None:
        """Test that invalid default shares are rejected."""
        service = HolderService(db)

        with pytest.raises(ValueError, match="Default shares must be greater than zero"):
            service.create_holder("John Doe", 0)

        with pytest.raises(ValueError, match="Default shares must be greater than zero"):
            service.create_holder("John Doe", -10)

    def test_get_holder(self, db: Session) -> None:
        """Test getting a holder by ID."""
        service = HolderService(db)

        created = service.create_holder("John Doe", 100)
        retrieved = service.get_holder(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.name == "John Doe"

    def test_get_holder_not_found(self, db: Session) -> None:
        """Test getting a non-existent holder returns None."""
        service = HolderService(db)

        result = service.get_holder(99999)

        assert result is None

    def test_get_holder_by_name(self, db: Session) -> None:
        """Test getting a holder by name."""
        service = HolderService(db)

        service.create_holder("John Doe", 100)
        retrieved = service.get_holder_by_name("John Doe")

        assert retrieved is not None
        assert retrieved.name == "John Doe"

    def test_get_holder_by_name_not_found(self, db: Session) -> None:
        """Test getting a non-existent holder by name returns None."""
        service = HolderService(db)

        result = service.get_holder_by_name("Non Existent")

        assert result is None

    def test_list_holders_active_only(self, db: Session) -> None:
        """Test listing only active holders."""
        service = HolderService(db)

        holder1 = service.create_holder("Active Holder", 100)
        service.create_holder("Another Active", 150)
        holder3 = service.create_holder("Inactive Holder", 75)

        # Deactivate one holder
        service.deactivate_holder(holder3.id)

        # List active only
        active_holders = service.list_holders(active_only=True)

        assert len(active_holders) == 2
        assert all(h.is_active for h in active_holders)
        assert holder1.name in [h.name for h in active_holders]
        assert holder3.name not in [h.name for h in active_holders]

    def test_list_holders_all(self, db: Session) -> None:
        """Test listing all holders including inactive."""
        service = HolderService(db)

        service.create_holder("Active Holder", 100)
        holder2 = service.create_holder("Inactive Holder", 75)

        # Deactivate one holder
        service.deactivate_holder(holder2.id)

        # List all
        all_holders = service.list_holders(active_only=False)

        assert len(all_holders) == 2

    def test_update_holder_name(self, db: Session) -> None:
        """Test updating holder name."""
        service = HolderService(db)

        holder = service.create_holder("Old Name", 100)
        updated = service.update_holder(holder.id, name="New Name")

        assert updated.name == "New Name"
        assert updated.default_shares == 100

    def test_update_holder_default_shares(self, db: Session) -> None:
        """Test updating holder default shares."""
        service = HolderService(db)

        holder = service.create_holder("John Doe", 100)
        updated = service.update_holder(holder.id, default_shares=200)

        assert updated.name == "John Doe"
        assert updated.default_shares == 200

    def test_update_holder_both_fields(self, db: Session) -> None:
        """Test updating both name and default shares."""
        service = HolderService(db)

        holder = service.create_holder("Old Name", 100)
        updated = service.update_holder(holder.id, name="New Name", default_shares=200)

        assert updated.name == "New Name"
        assert updated.default_shares == 200

    def test_update_holder_not_found(self, db: Session) -> None:
        """Test updating non-existent holder raises error."""
        service = HolderService(db)

        with pytest.raises(ValueError, match="Holder with id 99999 not found"):
            service.update_holder(99999, name="New Name")

    def test_update_holder_duplicate_name(self, db: Session) -> None:
        """Test updating to duplicate name is rejected."""
        service = HolderService(db)

        service.create_holder("John Doe", 100)
        holder2 = service.create_holder("Jane Smith", 150)

        with pytest.raises(ValueError, match="Holder with name 'John Doe' already exists"):
            service.update_holder(holder2.id, name="John Doe")

    def test_update_holder_empty_name(self, db: Session) -> None:
        """Test updating to empty name is rejected."""
        service = HolderService(db)

        holder = service.create_holder("John Doe", 100)

        with pytest.raises(ValueError, match="Holder name cannot be empty"):
            service.update_holder(holder.id, name="")

    def test_update_holder_invalid_default_shares(self, db: Session) -> None:
        """Test updating to invalid default shares is rejected."""
        service = HolderService(db)

        holder = service.create_holder("John Doe", 100)

        with pytest.raises(ValueError, match="Default shares must be greater than zero"):
            service.update_holder(holder.id, default_shares=0)

    def test_update_holder_cascades_to_allocations(
        self, db: Session, sample_period: MonthlyPeriod
    ) -> None:
        """Test that updating holder name cascades to allocations."""
        service = HolderService(db)

        # Create holder
        holder = service.create_holder("Old Name", 100)

        # Create allocation with this holder
        allocation = HolderAllocation(
            period_id=sample_period.id,
            holder_id=holder.id,
            holder_name="Old Name",
            shares=100,
            personal_charges=0,
            gross_allocation=1000,
            net_payout=1000,
        )
        db.add(allocation)
        db.commit()

        # Update holder name
        service.update_holder(holder.id, name="New Name")

        # Verify allocation was updated
        db.refresh(allocation)
        assert allocation.holder_name == "New Name"

    def test_deactivate_holder(self, db: Session) -> None:
        """Test deactivating a holder."""
        service = HolderService(db)

        holder = service.create_holder("John Doe", 100)
        deactivated = service.deactivate_holder(holder.id)

        assert deactivated.is_active is False
        assert deactivated.name == "John Doe"

    def test_deactivate_holder_not_found(self, db: Session) -> None:
        """Test deactivating non-existent holder raises error."""
        service = HolderService(db)

        with pytest.raises(ValueError, match="Holder with id 99999 not found"):
            service.deactivate_holder(99999)

    def test_get_or_create_holder_existing(self, db: Session) -> None:
        """Test get_or_create returns existing holder."""
        service = HolderService(db)

        # Create holder
        original = service.create_holder("John Doe", 100)

        # Get or create should return existing
        result = service.get_or_create_holder("John Doe", 200)

        assert result.id == original.id
        assert result.default_shares == 100  # Original value, not new value

    def test_get_or_create_holder_new(self, db: Session) -> None:
        """Test get_or_create creates new holder when not found."""
        service = HolderService(db)

        # Get or create should create new
        result = service.get_or_create_holder("New Holder", 150)

        assert result.id is not None
        assert result.name == "New Holder"
        assert result.default_shares == 150

    def test_get_or_create_holder_without_default_shares(self, db: Session) -> None:
        """Test get_or_create creates holder without default shares."""
        service = HolderService(db)

        result = service.get_or_create_holder("New Holder")

        assert result.id is not None
        assert result.name == "New Holder"
        assert result.default_shares is None
