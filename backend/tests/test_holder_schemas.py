"""Tests for holder Pydantic schemas."""

from datetime import datetime
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.holder import HolderCreate, HolderResponse, HolderUpdate, HolderWithStats


class TestHolderCreate:
    """Tests for HolderCreate schema."""

    def test_valid_holder_create(self):
        """Test creating a valid holder."""
        holder = HolderCreate(name="John Doe", default_shares=100)
        assert holder.name == "John Doe"
        assert holder.default_shares == 100

    def test_valid_holder_create_without_default_shares(self):
        """Test creating a holder without default shares."""
        holder = HolderCreate(name="Jane Smith")
        assert holder.name == "Jane Smith"
        assert holder.default_shares is None

    def test_holder_create_strips_whitespace(self):
        """Test that holder name is stripped of whitespace."""
        holder = HolderCreate(name="  John Doe  ", default_shares=100)
        assert holder.name == "John Doe"

    def test_holder_create_empty_name_fails(self):
        """Test that empty name fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            HolderCreate(name="", default_shares=100)
        assert "Holder name cannot be empty" in str(exc_info.value)

    def test_holder_create_whitespace_only_name_fails(self):
        """Test that whitespace-only name fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            HolderCreate(name="   ", default_shares=100)
        assert "Holder name cannot be empty" in str(exc_info.value)

    def test_holder_create_name_too_long_fails(self):
        """Test that name exceeding 255 characters fails validation."""
        long_name = "a" * 256
        with pytest.raises(ValidationError) as exc_info:
            HolderCreate(name=long_name, default_shares=100)
        assert "String should have at most 255 characters" in str(exc_info.value)

    def test_holder_create_zero_default_shares_fails(self):
        """Test that zero default shares fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            HolderCreate(name="John Doe", default_shares=0)
        assert "greater than 0" in str(exc_info.value)

    def test_holder_create_negative_default_shares_fails(self):
        """Test that negative default shares fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            HolderCreate(name="John Doe", default_shares=-10)
        assert "greater than 0" in str(exc_info.value)


class TestHolderUpdate:
    """Tests for HolderUpdate schema."""

    def test_valid_holder_update_name_only(self):
        """Test updating only the name."""
        holder = HolderUpdate(name="Jane Smith")
        assert holder.name == "Jane Smith"
        assert holder.default_shares is None

    def test_valid_holder_update_shares_only(self):
        """Test updating only the default shares."""
        holder = HolderUpdate(default_shares=150)
        assert holder.name is None
        assert holder.default_shares == 150

    def test_valid_holder_update_both_fields(self):
        """Test updating both name and default shares."""
        holder = HolderUpdate(name="Bob Johnson", default_shares=75)
        assert holder.name == "Bob Johnson"
        assert holder.default_shares == 75

    def test_holder_update_strips_whitespace(self):
        """Test that holder name is stripped of whitespace."""
        holder = HolderUpdate(name="  Jane Smith  ")
        assert holder.name == "Jane Smith"

    def test_holder_update_empty_name_fails(self):
        """Test that empty name fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            HolderUpdate(name="")
        assert "Holder name cannot be empty" in str(exc_info.value)

    def test_holder_update_whitespace_only_name_fails(self):
        """Test that whitespace-only name fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            HolderUpdate(name="   ")
        assert "Holder name cannot be empty" in str(exc_info.value)

    def test_holder_update_zero_default_shares_fails(self):
        """Test that zero default shares fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            HolderUpdate(default_shares=0)
        assert "greater than 0" in str(exc_info.value)

    def test_holder_update_negative_default_shares_fails(self):
        """Test that negative default shares fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            HolderUpdate(default_shares=-10)
        assert "greater than 0" in str(exc_info.value)


class TestHolderResponse:
    """Tests for HolderResponse schema."""

    def test_holder_response_from_dict(self):
        """Test creating HolderResponse from dictionary."""
        data = {
            "id": 1,
            "name": "John Doe",
            "default_shares": 100,
            "is_active": True,
            "created_at": datetime(2024, 1, 15, 10, 30, 0),
            "updated_at": datetime(2024, 1, 15, 10, 30, 0),
        }
        holder = HolderResponse(**data)
        assert holder.id == 1
        assert holder.name == "John Doe"
        assert holder.default_shares == 100
        assert holder.is_active is True

    def test_holder_response_without_default_shares(self):
        """Test HolderResponse without default shares."""
        data = {
            "id": 2,
            "name": "Jane Smith",
            "default_shares": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 15, 10, 30, 0),
            "updated_at": datetime(2024, 1, 15, 10, 30, 0),
        }
        holder = HolderResponse(**data)
        assert holder.id == 2
        assert holder.name == "Jane Smith"
        assert holder.default_shares is None


class TestHolderWithStats:
    """Tests for HolderWithStats schema."""

    def test_holder_with_stats_complete(self):
        """Test creating HolderWithStats with all fields."""
        data = {
            "id": 1,
            "name": "John Doe",
            "default_shares": 100,
            "is_active": True,
            "created_at": datetime(2024, 1, 15, 10, 30, 0),
            "updated_at": datetime(2024, 1, 15, 10, 30, 0),
            "total_periods": 12,
            "first_period": "2023-01",
            "last_period": "2023-12",
            "total_payout": Decimal("54000.00"),
        }
        holder = HolderWithStats(**data)
        assert holder.id == 1
        assert holder.name == "John Doe"
        assert holder.total_periods == 12
        assert holder.first_period == "2023-01"
        assert holder.last_period == "2023-12"
        assert holder.total_payout == Decimal("54000.00")

    def test_holder_with_stats_no_participation(self):
        """Test HolderWithStats for holder with no participation."""
        data = {
            "id": 2,
            "name": "New Holder",
            "default_shares": 100,
            "is_active": True,
            "created_at": datetime(2024, 1, 15, 10, 30, 0),
            "updated_at": datetime(2024, 1, 15, 10, 30, 0),
            "total_periods": 0,
            "first_period": None,
            "last_period": None,
            "total_payout": Decimal("0.00"),
        }
        holder = HolderWithStats(**data)
        assert holder.total_periods == 0
        assert holder.first_period is None
        assert holder.last_period is None
        assert holder.total_payout == Decimal("0.00")
