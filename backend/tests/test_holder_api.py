"""Tests for holder API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import get_db
from app.main import app
from app.middleware.auth import get_current_user
from app.models.base import Base
from app.schemas.auth import TokenData

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_holder_api.db"
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


def override_get_current_user():
    """Override authentication for testing."""
    return TokenData(username="testuser")


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_create_holder_success():
    """Test creating a new holder successfully."""
    holder_data = {
        "name": "John Doe",
        "default_shares": 100,
    }

    response = client.post("/api/holders", json=holder_data)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "John Doe"
    assert data["default_shares"] == 100
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_holder_without_default_shares():
    """Test creating a holder without default shares."""
    holder_data = {
        "name": "Jane Smith",
    }

    response = client.post("/api/holders", json=holder_data)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Smith"
    assert data["default_shares"] is None
    assert data["is_active"] is True


def test_create_holder_duplicate_name():
    """Test creating a holder with duplicate name returns 409."""
    holder_data = {
        "name": "John Doe",
        "default_shares": 100,
    }

    # Create first holder
    response1 = client.post("/api/holders", json=holder_data)
    assert response1.status_code == 201

    # Try to create duplicate
    response2 = client.post("/api/holders", json=holder_data)
    assert response2.status_code == 409
    assert "already exists" in response2.json()["detail"]


def test_create_holder_empty_name():
    """Test creating a holder with empty name returns 400."""
    holder_data = {
        "name": "",
        "default_shares": 100,
    }

    response = client.post("/api/holders", json=holder_data)
    assert response.status_code == 400


def test_create_holder_invalid_default_shares():
    """Test creating a holder with invalid default shares returns 400."""
    holder_data = {
        "name": "John Doe",
        "default_shares": -10,
    }

    response = client.post("/api/holders", json=holder_data)
    assert response.status_code == 400


def test_list_holders_empty():
    """Test listing holders when none exist."""
    response = client.get("/api/holders")
    assert response.status_code == 200
    assert response.json() == []


def test_list_holders():
    """Test listing multiple holders."""
    # Create holders
    client.post("/api/holders", json={"name": "John Doe", "default_shares": 100})
    client.post("/api/holders", json={"name": "Jane Smith", "default_shares": 150})
    client.post("/api/holders", json={"name": "Bob Johnson", "default_shares": 75})

    response = client.get("/api/holders")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    # Should be ordered by name
    assert data[0]["name"] == "Bob Johnson"
    assert data[1]["name"] == "Jane Smith"
    assert data[2]["name"] == "John Doe"


def test_list_holders_active_only():
    """Test listing only active holders."""
    # Create holders
    response1 = client.post("/api/holders", json={"name": "John Doe", "default_shares": 100})
    holder1_id = response1.json()["id"]

    response2 = client.post("/api/holders", json={"name": "Jane Smith", "default_shares": 150})
    holder2_id = response2.json()["id"]

    # Deactivate one holder
    client.delete(f"/api/holders/{holder1_id}")

    # List active only (default)
    response = client.get("/api/holders")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Jane Smith"

    # List all holders
    response = client.get("/api/holders?active_only=false")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_holder_success():
    """Test getting a specific holder by ID."""
    # Create holder
    create_response = client.post(
        "/api/holders", json={"name": "John Doe", "default_shares": 100}
    )
    holder_id = create_response.json()["id"]

    # Get holder
    response = client.get(f"/api/holders/{holder_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == holder_id
    assert data["name"] == "John Doe"
    assert data["default_shares"] == 100


def test_get_holder_not_found():
    """Test getting a holder that doesn't exist returns 404."""
    response = client.get("/api/holders/999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_update_holder_name():
    """Test updating a holder's name."""
    # Create holder
    create_response = client.post(
        "/api/holders", json={"name": "John Doe", "default_shares": 100}
    )
    holder_id = create_response.json()["id"]

    # Update name
    update_data = {"name": "John Smith"}
    response = client.put(f"/api/holders/{holder_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "John Smith"
    assert data["default_shares"] == 100  # Unchanged


def test_update_holder_default_shares():
    """Test updating a holder's default shares."""
    # Create holder
    create_response = client.post(
        "/api/holders", json={"name": "John Doe", "default_shares": 100}
    )
    holder_id = create_response.json()["id"]

    # Update default shares
    update_data = {"default_shares": 150}
    response = client.put(f"/api/holders/{holder_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "John Doe"  # Unchanged
    assert data["default_shares"] == 150


def test_update_holder_both_fields():
    """Test updating both name and default shares."""
    # Create holder
    create_response = client.post(
        "/api/holders", json={"name": "John Doe", "default_shares": 100}
    )
    holder_id = create_response.json()["id"]

    # Update both fields
    update_data = {"name": "Jane Doe", "default_shares": 200}
    response = client.put(f"/api/holders/{holder_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["default_shares"] == 200


def test_update_holder_not_found():
    """Test updating a holder that doesn't exist returns 404."""
    update_data = {"name": "John Smith"}
    response = client.put("/api/holders/999", json=update_data)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_update_holder_duplicate_name():
    """Test updating a holder to a duplicate name returns 409."""
    # Create two holders
    client.post("/api/holders", json={"name": "John Doe", "default_shares": 100})
    response2 = client.post("/api/holders", json={"name": "Jane Smith", "default_shares": 150})
    holder2_id = response2.json()["id"]

    # Try to update second holder to first holder's name
    update_data = {"name": "John Doe"}
    response = client.put(f"/api/holders/{holder2_id}", json=update_data)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_update_holder_invalid_default_shares():
    """Test updating a holder with invalid default shares returns 400."""
    # Create holder
    create_response = client.post(
        "/api/holders", json={"name": "John Doe", "default_shares": 100}
    )
    holder_id = create_response.json()["id"]

    # Try to update with invalid shares
    update_data = {"default_shares": -10}
    response = client.put(f"/api/holders/{holder_id}", json=update_data)
    assert response.status_code == 400


def test_deactivate_holder_success():
    """Test deactivating a holder."""
    # Create holder
    create_response = client.post(
        "/api/holders", json={"name": "John Doe", "default_shares": 100}
    )
    holder_id = create_response.json()["id"]

    # Deactivate holder
    response = client.delete(f"/api/holders/{holder_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False

    # Verify holder is not in active list
    list_response = client.get("/api/holders")
    assert len(list_response.json()) == 0

    # Verify holder is in full list
    list_all_response = client.get("/api/holders?active_only=false")
    assert len(list_all_response.json()) == 1


def test_deactivate_holder_not_found():
    """Test deactivating a holder that doesn't exist returns 404."""
    response = client.delete("/api/holders/999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_holder_name_trimming():
    """Test that holder names are trimmed of whitespace."""
    holder_data = {
        "name": "  John Doe  ",
        "default_shares": 100,
    }

    response = client.post("/api/holders", json=holder_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "John Doe"  # Trimmed
