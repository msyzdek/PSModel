"""Tests for PeriodService."""

from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.models.base import Base
from app.schemas.period import HolderInput, PeriodInput
from app.services.period_service import PeriodService


@pytest.fixture
def db_session() -> Session:
    """Create a test database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def period_service(db_session: Session) -> PeriodService:
    """Create a PeriodService instance."""
    return PeriodService(db_session)


def test_create_period_basic(period_service: PeriodService) -> None:
    """Test creating a basic period without carry-forwards."""
    period_data = PeriodInput(
        year=2024,
        month=1,
        net_income_qb=Decimal("100000.00"),
        ps_addback=Decimal("5000.00"),
        owner_draws=Decimal("10000.00"),
    )

    holders = [
        HolderInput(holder_name="Alice", shares=60, personal_charges=Decimal("500.00")),
        HolderInput(holder_name="Bob", shares=40, personal_charges=Decimal("300.00")),
    ]

    period = period_service.create_period(period_data, holders)

    assert period.id is not None
    assert period.year == 2024
    assert period.month == 1
    assert period.adjusted_pool == Decimal("95800.00")  # 100000 + 5000 + 800 - 10000
    assert period.total_shares == 100
    assert len(period.allocations) == 2


def test_create_period_with_carry_forward(period_service: PeriodService) -> None:
    """Test creating a period with carry-forwards from prior period."""
    # Create first period
    period1_data = PeriodInput(
        year=2024,
        month=1,
        net_income_qb=Decimal("10000.00"),
        ps_addback=Decimal("0.00"),
        owner_draws=Decimal("0.00"),
    )

    holders1 = [
        HolderInput(holder_name="Alice", shares=50, personal_charges=Decimal("8000.00")),
        HolderInput(holder_name="Bob", shares=50, personal_charges=Decimal("0.00")),
    ]

    period1 = period_service.create_period(period1_data, holders1)

    # Alice should have carry-forward since her charges exceed her allocation
    alice_alloc = next(a for a in period1.allocations if a.holder_name == "Alice")
    assert alice_alloc.carry_forward_out > 0

    # Create second period
    period2_data = PeriodInput(
        year=2024,
        month=2,
        net_income_qb=Decimal("20000.00"),
        ps_addback=Decimal("0.00"),
        owner_draws=Decimal("0.00"),
    )

    holders2 = [
        HolderInput(holder_name="Alice", shares=50, personal_charges=Decimal("0.00")),
        HolderInput(holder_name="Bob", shares=50, personal_charges=Decimal("0.00")),
    ]

    period2 = period_service.create_period(period2_data, holders2)

    # Alice should have carry-forward applied
    alice_alloc2 = next(a for a in period2.allocations if a.holder_name == "Alice")
    assert alice_alloc2.carry_forward_in == alice_alloc.carry_forward_out


def test_update_period(period_service: PeriodService) -> None:
    """Test updating an existing period."""
    # Create initial period
    period_data = PeriodInput(
        year=2024,
        month=1,
        net_income_qb=Decimal("100000.00"),
        ps_addback=Decimal("5000.00"),
        owner_draws=Decimal("10000.00"),
    )

    holders = [
        HolderInput(holder_name="Alice", shares=60, personal_charges=Decimal("500.00")),
    ]

    period = period_service.create_period(period_data, holders)
    original_id = period.id

    # Update the period
    updated_data = PeriodInput(
        year=2024,
        month=1,
        net_income_qb=Decimal("120000.00"),
        ps_addback=Decimal("6000.00"),
        owner_draws=Decimal("12000.00"),
    )

    updated_holders = [
        HolderInput(holder_name="Alice", shares=60, personal_charges=Decimal("600.00")),
        HolderInput(holder_name="Bob", shares=40, personal_charges=Decimal("400.00")),
    ]

    updated_period = period_service.update_period(2024, 1, updated_data, updated_holders)

    assert updated_period.id == original_id
    assert updated_period.net_income_qb == Decimal("120000.00")
    assert len(updated_period.allocations) == 2


def test_get_prior_period(period_service: PeriodService) -> None:
    """Test getting prior period for carry-forward lookup."""
    # Create periods
    period1_data = PeriodInput(
        year=2024, month=1, net_income_qb=Decimal("10000.00")
    )
    holders = [HolderInput(holder_name="Alice", shares=100)]
    period_service.create_period(period1_data, holders)

    period2_data = PeriodInput(
        year=2024, month=2, net_income_qb=Decimal("10000.00")
    )
    period_service.create_period(period2_data, holders)

    # Test getting prior period
    prior = period_service.get_prior_period(2024, 2)
    assert prior is not None
    assert prior.year == 2024
    assert prior.month == 1

    # Test year boundary
    prior_year = period_service.get_prior_period(2024, 1)
    assert prior_year is None or (prior_year.year == 2023 and prior_year.month == 12)


def test_list_periods(period_service: PeriodService) -> None:
    """Test listing periods."""
    # Create multiple periods
    holders = [HolderInput(holder_name="Alice", shares=100)]

    for month in range(1, 4):
        period_data = PeriodInput(
            year=2024, month=month, net_income_qb=Decimal("10000.00")
        )
        period_service.create_period(period_data, holders)

    periods = period_service.list_periods()

    assert len(periods) == 3
    # Should be ordered by most recent first
    assert periods[0].month == 3
    assert periods[1].month == 2
    assert periods[2].month == 1
