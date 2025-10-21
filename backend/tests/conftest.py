"""Pytest configuration and fixtures."""

import pytest


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
