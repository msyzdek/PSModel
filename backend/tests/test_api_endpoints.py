"""Tests for API endpoints."""

from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import get_db
from app.main import app
from app.models.base import Base

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_api.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_root_endpoint():
    """Test root endpoint returns correct response."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Profit Share Calculator API",
        "version": "0.1.0",
    }


def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_create_period():
    """Test creating a new period."""
    period_data = {
        "year": 2024,
        "month": 1,
        "net_income_qb": 100000.00,
        "ps_addback": 5000.00,
        "owner_draws": 10000.00,
    }
    holders = [
        {"holder_name": "John Doe", "shares": 100, "personal_charges": 500.00},
        {"holder_name": "Jane Smith", "shares": 50, "personal_charges": 250.00},
    ]

    response = client.post(
        "/api/periods",
        json={"period_data": period_data, "holders": holders},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["period"]["year"] == 2024
    assert data["period"]["month"] == 1
    assert len(data["allocations"]) == 2


def test_list_periods_empty():
    """Test listing periods when none exist."""
    response = client.get("/api/periods")
    assert response.status_code == 200
    assert response.json() == []


def test_get_period_not_found():
    """Test getting a period that doesn't exist."""
    response = client.get("/api/periods/2024/1")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_preview_calculation():
    """Test preview calculation without saving."""
    period_data = {
        "year": 2024,
        "month": 1,
        "net_income_qb": 100000.00,
        "ps_addback": 5000.00,
        "owner_draws": 10000.00,
    }
    holders = [
        {"holder_name": "John Doe", "shares": 100, "personal_charges": 500.00},
    ]

    response = client.post(
        "/api/calculate/preview",
        json={"period_data": period_data, "holders": holders},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["period"]["year"] == 2024
    assert data["period"]["month"] == 1
    assert len(data["allocations"]) == 1

    # Verify period was not saved
    get_response = client.get("/api/periods/2024/1")
    assert get_response.status_code == 404


def test_validation_error():
    """Test validation error handling."""
    # Invalid month (must be 1-12)
    period_data = {
        "year": 2024,
        "month": 13,  # Invalid
        "net_income_qb": 100000.00,
    }
    holders = [{"holder_name": "John Doe", "shares": 100}]

    response = client.post(
        "/api/periods",
        json={"period_data": period_data, "holders": holders},
    )

    assert response.status_code == 400
    assert "validation_error" in response.json()["type"]
