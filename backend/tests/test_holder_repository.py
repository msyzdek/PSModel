"""Tests for HolderRepository."""

import pytest
from sqlalchemy.orm import Session

from app.models.holder import Holder
from app.models.holder_allocation import HolderAllocation
from app.models.monthly_period import MonthlyPeriod
from app.repositories.holder_repository import HolderRepository


def test_save_holder(db_session: Session) -> None:
    """Test saving a holder."""
    repo = HolderRepository(db_session)
    holder = Holder(name="Test Holder", default_shares=100, is_active=True)
    
    saved_holder = repo.save(holder)
    
    assert saved_holder.id is not None
    assert saved_holder.name == "Test Holder"
    assert saved_holder.default_shares == 100
    assert saved_holder.is_active is True


def test_find_by_id(db_session: Session) -> None:
    """Test finding a holder by ID."""
    repo = HolderRepository(db_session)
    holder = Holder(name="Test Holder", default_shares=100, is_active=True)
    saved_holder = repo.save(holder)
    
    found_holder = repo.find_by_id(saved_holder.id)
    
    assert found_holder is not None
    assert found_holder.id == saved_holder.id
    assert found_holder.name == "Test Holder"


def test_find_by_id_not_found(db_session: Session) -> None:
    """Test finding a holder by ID that doesn't exist."""
    repo = HolderRepository(db_session)
    
    found_holder = repo.find_by_id(999)
    
    assert found_holder is None


def test_find_by_name(db_session: Session) -> None:
    """Test finding a holder by name."""
    repo = HolderRepository(db_session)
    holder = Holder(name="Test Holder", default_shares=100, is_active=True)
    repo.save(holder)
    
    found_holder = repo.find_by_name("Test Holder")
    
    assert found_holder is not None
    assert found_holder.name == "Test Holder"


def test_find_by_name_not_found(db_session: Session) -> None:
    """Test finding a holder by name that doesn't exist."""
    repo = HolderRepository(db_session)
    
    found_holder = repo.find_by_name("Nonexistent Holder")
    
    assert found_holder is None


def test_find_all_active_only(db_session: Session) -> None:
    """Test finding all active holders."""
    repo = HolderRepository(db_session)
    repo.save(Holder(name="Active Holder 1", default_shares=100, is_active=True))
    repo.save(Holder(name="Active Holder 2", default_shares=150, is_active=True))
    repo.save(Holder(name="Inactive Holder", default_shares=50, is_active=False))
    
    holders = repo.find_all(active_only=True)
    
    assert len(holders) == 2
    assert all(h.is_active for h in holders)
    assert holders[0].name == "Active Holder 1"  # Ordered by name
    assert holders[1].name == "Active Holder 2"


def test_find_all_include_inactive(db_session: Session) -> None:
    """Test finding all holders including inactive."""
    repo = HolderRepository(db_session)
    repo.save(Holder(name="Active Holder", default_shares=100, is_active=True))
    repo.save(Holder(name="Inactive Holder", default_shares=50, is_active=False))
    
    holders = repo.find_all(active_only=False)
    
    assert len(holders) == 2


def test_update_holder(db_session: Session) -> None:
    """Test updating a holder."""
    repo = HolderRepository(db_session)
    holder = Holder(name="Test Holder", default_shares=100, is_active=True)
    saved_holder = repo.save(holder)
    
    saved_holder.name = "Updated Holder"
    saved_holder.default_shares = 200
    updated_holder = repo.update(saved_holder)
    
    assert updated_holder.name == "Updated Holder"
    assert updated_holder.default_shares == 200


def test_delete_holder(db_session: Session) -> None:
    """Test deleting a holder."""
    repo = HolderRepository(db_session)
    holder = Holder(name="Test Holder", default_shares=100, is_active=True)
    saved_holder = repo.save(holder)
    
    repo.delete(saved_holder.id)
    
    found_holder = repo.find_by_id(saved_holder.id)
    assert found_holder is None


def test_delete_nonexistent_holder(db_session: Session) -> None:
    """Test deleting a holder that doesn't exist."""
    repo = HolderRepository(db_session)
    
    # Should not raise an error
    repo.delete(999)


def test_count_allocations_zero(db_session: Session) -> None:
    """Test counting allocations for a holder with no allocations."""
    repo = HolderRepository(db_session)
    holder = Holder(name="Test Holder", default_shares=100, is_active=True)
    saved_holder = repo.save(holder)
    
    count = repo.count_allocations(saved_holder.id)
    
    assert count == 0


def test_count_allocations_with_data(db_session: Session) -> None:
    """Test counting allocations for a holder with allocations."""
    repo = HolderRepository(db_session)
    
    # Create holder
    holder = Holder(name="Test Holder", default_shares=100, is_active=True)
    saved_holder = repo.save(holder)
    
    # Create period
    period = MonthlyPeriod(
        year=2024,
        month=1,
        net_income_qb=100000.00,
        ps_addback=5000.00,
        owner_draws=10000.00,
        uncollectible=0.00,
        bad_debt=0.00,
        tax_optimization=0.00,
        adjusted_pool=95000.00,
        total_shares=100,
    )
    db_session.add(period)
    db_session.commit()
    
    # Create allocations
    allocation1 = HolderAllocation(
        period_id=period.id,
        holder_id=saved_holder.id,
        holder_name="Test Holder",
        shares=100,
        personal_charges=500.00,
        carry_forward_in=0.00,
        gross_allocation=95000.00,
        net_payout=94500.00,
        carry_forward_out=0.00,
        received_rounding_adjustment=False,
    )
    db_session.add(allocation1)
    db_session.commit()
    
    count = repo.count_allocations(saved_holder.id)
    
    assert count == 1
