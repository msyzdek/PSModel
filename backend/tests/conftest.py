"""Pytest configuration and fixtures."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.models.base import Base
from tests.fixtures import TestFixtures


@pytest.fixture
def sample_period_data() -> dict:
    """Sample period data for testing."""
    return {
        "year": 2024,
        "month": 1,
        "net_income_qb": 100000.00,
        "ps_addback": 5000.00,
        "owner_draws": 10000.00,
        "uncollectible": 0.00,
        "bad_debt": 0.00,
        "tax_optimization": 0.00,
    }


@pytest.fixture
def sample_holders() -> list[dict]:
    """Sample holder data for testing."""
    return [
        {"holder_name": "Holder A", "shares": 60, "personal_charges": 1000.00},
        {"holder_name": "Holder B", "shares": 40, "personal_charges": 500.00},
    ]


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
def db() -> Session:
    """Create a test database session (alias for db_session)."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def sample_period(db: Session):
    """Create a sample period for testing."""
    from app.models.monthly_period import MonthlyPeriod
    from decimal import Decimal

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
    return period


@pytest.fixture
def test_fixtures() -> TestFixtures:
    """Provide access to test fixtures."""
    return TestFixtures()
