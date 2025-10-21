"""Quick verification script for HolderService implementation."""

from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.holder import Holder
from app.models.holder_allocation import HolderAllocation
from app.models.monthly_period import MonthlyPeriod
from app.services.holder_service import HolderService


def verify_holder_service() -> None:
    """Verify HolderService implementation."""
    # Create in-memory database
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        service = HolderService(db)

        print("✓ HolderService instantiated successfully")

        # Test 1: Create holder
        holder1 = service.create_holder("John Doe", 100)
        assert holder1.id is not None
        assert holder1.name == "John Doe"
        assert holder1.default_shares == 100
        assert holder1.is_active is True
        print("✓ Test 1: create_holder works")

        # Test 2: Create holder without default shares
        holder2 = service.create_holder("Jane Smith")
        assert holder2.default_shares is None
        print("✓ Test 2: create_holder without default_shares works")

        # Test 3: Duplicate name validation
        try:
            service.create_holder("John Doe", 150)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "already exists" in str(e)
        print("✓ Test 3: duplicate name validation works")

        # Test 4: Empty name validation
        try:
            service.create_holder("", 100)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "cannot be empty" in str(e)
        print("✓ Test 4: empty name validation works")

        # Test 5: Invalid default shares validation
        try:
            service.create_holder("Test User", 0)
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "greater than zero" in str(e)
        print("✓ Test 5: invalid default_shares validation works")

        # Test 6: Get holder by ID
        retrieved = service.get_holder(holder1.id)
        assert retrieved is not None
        assert retrieved.name == "John Doe"
        print("✓ Test 6: get_holder works")

        # Test 7: Get holder by name
        retrieved = service.get_holder_by_name("Jane Smith")
        assert retrieved is not None
        assert retrieved.id == holder2.id
        print("✓ Test 7: get_holder_by_name works")

        # Test 8: List holders (active only)
        holders = service.list_holders(active_only=True)
        assert len(holders) == 2
        print("✓ Test 8: list_holders (active_only=True) works")

        # Test 9: Update holder name
        updated = service.update_holder(holder1.id, name="John Smith")
        assert updated.name == "John Smith"
        assert updated.default_shares == 100
        print("✓ Test 9: update_holder name works")

        # Test 10: Update holder default shares
        updated = service.update_holder(holder1.id, default_shares=200)
        assert updated.name == "John Smith"
        assert updated.default_shares == 200
        print("✓ Test 10: update_holder default_shares works")

        # Test 11: Deactivate holder
        deactivated = service.deactivate_holder(holder2.id)
        assert deactivated.is_active is False
        print("✓ Test 11: deactivate_holder works")

        # Test 12: List holders excludes inactive
        active_holders = service.list_holders(active_only=True)
        assert len(active_holders) == 1
        assert active_holders[0].id == holder1.id
        print("✓ Test 12: list_holders excludes inactive holders")

        # Test 13: List all holders includes inactive
        all_holders = service.list_holders(active_only=False)
        assert len(all_holders) == 2
        print("✓ Test 13: list_holders (active_only=False) includes inactive")

        # Test 14: get_or_create with existing holder
        existing = service.get_or_create_holder("John Smith", 300)
        assert existing.id == holder1.id
        assert existing.default_shares == 200  # Original value, not new
        print("✓ Test 14: get_or_create_holder returns existing holder")

        # Test 15: get_or_create with new holder
        new_holder = service.get_or_create_holder("Bob Johnson", 150)
        assert new_holder.id is not None
        assert new_holder.name == "Bob Johnson"
        assert new_holder.default_shares == 150
        print("✓ Test 15: get_or_create_holder creates new holder")

        # Test 16: Cascade name update to allocations
        # Create a period first
        period = MonthlyPeriod(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("5000.00"),
            owner_draws=Decimal("10000.00"),
            uncollectible=Decimal("0.00"),
            bad_debt=Decimal("0.00"),
            tax_optimization=Decimal("0.00"),
            adjusted_pool=Decimal("95000.00"),
            total_shares=100,
            rounding_delta=Decimal("0.00"),
        )
        db.add(period)
        db.commit()
        db.refresh(period)

        # Create allocation
        allocation = HolderAllocation(
            period_id=period.id,
            holder_id=holder1.id,
            holder_name="John Smith",
            shares=100,
            personal_charges=Decimal("0.00"),
            gross_allocation=Decimal("95000.00"),
            net_payout=Decimal("95000.00"),
        )
        db.add(allocation)
        db.commit()

        # Update holder name
        service.update_holder(holder1.id, name="John Doe Updated")

        # Verify allocation was updated
        db.refresh(allocation)
        assert allocation.holder_name == "John Doe Updated"
        print("✓ Test 16: update_holder cascades name to allocations")

        print("\n✅ All tests passed! HolderService implementation is correct.")

    finally:
        db.close()


if __name__ == "__main__":
    verify_holder_service()
