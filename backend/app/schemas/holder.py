"""Pydantic schemas for holder management."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class HolderCreate(BaseModel):
    """Schema for creating a new holder."""

    name: str = Field(..., min_length=1, max_length=255, description="Name of the holder")
    default_shares: Optional[int] = Field(
        None, gt=0, description="Default number of shares for the holder"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate holder name is not empty after stripping."""
        if not v or not v.strip():
            raise ValueError("Holder name cannot be empty")
        return v.strip()

    @field_validator("default_shares")
    @classmethod
    def validate_default_shares(cls, v: Optional[int]) -> Optional[int]:
        """Validate default shares are positive integers if provided."""
        if v is not None:
            if not isinstance(v, int):
                raise ValueError("Default shares must be an integer")
            if v <= 0:
                raise ValueError("Default shares must be a positive integer")
        return v

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "default_shares": 100,
            }
        }


class HolderUpdate(BaseModel):
    """Schema for updating an existing holder."""

    name: Optional[str] = Field(
        None, min_length=1, max_length=255, description="Name of the holder"
    )
    default_shares: Optional[int] = Field(
        None, gt=0, description="Default number of shares for the holder"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate holder name is not empty after stripping if provided."""
        if v is not None:
            if not v.strip():
                raise ValueError("Holder name cannot be empty")
            return v.strip()
        return v

    @field_validator("default_shares")
    @classmethod
    def validate_default_shares(cls, v: Optional[int]) -> Optional[int]:
        """Validate default shares are positive integers if provided."""
        if v is not None:
            if not isinstance(v, int):
                raise ValueError("Default shares must be an integer")
            if v <= 0:
                raise ValueError("Default shares must be a positive integer")
        return v

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "name": "Jane Smith",
                "default_shares": 150,
            }
        }


class HolderResponse(BaseModel):
    """Schema for holder response."""

    id: int
    name: str
    default_shares: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "John Doe",
                "default_shares": 100,
                "is_active": True,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00",
            }
        }


class HolderWithStats(HolderResponse):
    """Schema for holder details with participation statistics."""

    total_periods: int = Field(..., description="Total number of periods holder participated in")
    first_period: Optional[str] = Field(
        None, description="First period of participation (YYYY-MM format)"
    )
    last_period: Optional[str] = Field(
        None, description="Last period of participation (YYYY-MM format)"
    )
    total_payout: Decimal = Field(..., description="Total payout across all periods")

    class Config:
        """Pydantic config."""

        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "John Doe",
                "default_shares": 100,
                "is_active": True,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00",
                "total_periods": 12,
                "first_period": "2023-01",
                "last_period": "2023-12",
                "total_payout": 54000.00,
            }
        }
