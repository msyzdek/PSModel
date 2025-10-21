"""Pydantic schemas for period input and summary."""

from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class PeriodInput(BaseModel):
    """Schema for period input data."""

    year: int = Field(..., ge=2000, le=2100, description="Year of the period")
    month: int = Field(..., ge=1, le=12, description="Month of the period (1-12)")
    net_income_qb: Decimal = Field(..., description="QuickBooks Net Income")
    ps_addback: Decimal = Field(default=Decimal("0"), description="PS payout add-back")
    owner_draws: Decimal = Field(default=Decimal("0"), description="Total owner draws")
    uncollectible: Decimal = Field(
        default=Decimal("0"), description="Uncollectible income amount"
    )
    bad_debt: Decimal = Field(default=Decimal("0"), description="Bad debt amount")
    tax_optimization: Decimal = Field(
        default=Decimal("0"), description="Tax optimization return amount"
    )

    @field_validator("year", "month")
    @classmethod
    def validate_positive(cls, v: int) -> int:
        """Validate that year and month are positive."""
        if v <= 0:
            raise ValueError("Value must be positive")
        return v

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "year": 2024,
                "month": 1,
                "net_income_qb": 100000.00,
                "ps_addback": 5000.00,
                "owner_draws": 10000.00,
                "uncollectible": 0.00,
                "bad_debt": 0.00,
                "tax_optimization": 0.00,
            }
        }


class HolderInput(BaseModel):
    """Schema for holder allocation input data."""

    holder_name: str = Field(..., min_length=1, max_length=255, description="Name of the holder")
    shares: int = Field(..., gt=0, description="Number of shares held")
    personal_charges: Decimal = Field(
        default=Decimal("0"), ge=0, description="Personal charges for the holder"
    )

    @field_validator("holder_name")
    @classmethod
    def validate_holder_name(cls, v: str) -> str:
        """Validate holder name is not empty after stripping."""
        if not v.strip():
            raise ValueError("Holder name cannot be empty")
        return v.strip()

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "holder_name": "John Doe",
                "shares": 100,
                "personal_charges": 500.00,
            }
        }


class PeriodSummary(BaseModel):
    """Schema for period summary response."""

    id: int
    year: int
    month: int
    net_income_qb: Decimal
    ps_addback: Decimal
    owner_draws: Decimal
    uncollectible: Decimal
    bad_debt: Decimal
    tax_optimization: Decimal
    adjusted_pool: Decimal
    total_shares: int
    rounding_delta: Decimal
    created_at: str
    updated_at: str

    class Config:
        """Pydantic config."""

        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "year": 2024,
                "month": 1,
                "net_income_qb": 100000.00,
                "ps_addback": 5000.00,
                "owner_draws": 10000.00,
                "uncollectible": 0.00,
                "bad_debt": 0.00,
                "tax_optimization": 0.00,
                "adjusted_pool": 95000.00,
                "total_shares": 1000,
                "rounding_delta": 0.02,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00",
            }
        }
