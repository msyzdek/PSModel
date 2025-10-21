"""Pydantic schemas for period input and summary."""

from decimal import Decimal, InvalidOperation
from typing import List

from pydantic import BaseModel, Field, field_validator, model_validator


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

    @field_validator(
        "net_income_qb",
        "ps_addback",
        "owner_draws",
        "uncollectible",
        "bad_debt",
        "tax_optimization",
    )
    @classmethod
    def validate_decimal_fields(cls, v: Decimal, info) -> Decimal:
        """Validate that decimal fields are valid numbers."""
        if v is None:
            raise ValueError(f"{info.field_name} is required")
        try:
            # Ensure it's a valid Decimal
            if not isinstance(v, Decimal):
                v = Decimal(str(v))
            # Check for NaN or Infinity
            if v.is_nan() or v.is_infinite():
                raise ValueError(f"{info.field_name} must be a valid number")
        except (InvalidOperation, ValueError) as e:
            raise ValueError(f"{info.field_name} must be a valid number") from e
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
        if not v or not v.strip():
            raise ValueError("Holder name cannot be empty")
        return v.strip()

    @field_validator("shares")
    @classmethod
    def validate_shares(cls, v: int) -> int:
        """Validate shares are positive integers."""
        if not isinstance(v, int):
            raise ValueError("Shares must be an integer")
        if v <= 0:
            raise ValueError("Shares must be a positive integer")
        return v

    @field_validator("personal_charges")
    @classmethod
    def validate_personal_charges(cls, v: Decimal) -> Decimal:
        """Validate personal charges are non-negative."""
        if v is None:
            raise ValueError("Personal charges is required")
        try:
            if not isinstance(v, Decimal):
                v = Decimal(str(v))
            if v.is_nan() or v.is_infinite():
                raise ValueError("Personal charges must be a valid number")
        except (InvalidOperation, ValueError) as e:
            raise ValueError("Personal charges must be a valid number") from e
        if v < 0:
            raise ValueError("Personal charges must be non-negative")
        return v

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "holder_name": "John Doe",
                "shares": 100,
                "personal_charges": 500.00,
            }
        }


class PeriodCreateRequest(BaseModel):
    """Schema for creating a period with holders."""

    period: PeriodInput = Field(..., description="Period input data")
    holders: List[HolderInput] = Field(..., min_length=1, description="List of holder allocations")

    @model_validator(mode="after")
    def validate_period_and_holders(self) -> "PeriodCreateRequest":
        """Validate the relationship between period data and holders."""
        # Validate at least one holder is provided
        if not self.holders or len(self.holders) == 0:
            raise ValueError("At least one holder must be provided")

        # Calculate adjusted pool to check if validation is needed
        personal_addback_total = sum(
            (h.personal_charges for h in self.holders), Decimal("0")
        )
        adjusted_pool = (
            self.period.net_income_qb
            + self.period.ps_addback
            + personal_addback_total
            - self.period.owner_draws
            - self.period.uncollectible
            - self.period.tax_optimization
            + self.period.bad_debt
        )

        # Validate total_shares > 0 when adjusted_pool > 0
        total_shares = sum(h.shares for h in self.holders)
        if adjusted_pool > 0 and total_shares == 0:
            raise ValueError("Total shares must be greater than 0 when adjusted pool is positive")

        # Validate unique holder names
        holder_names = [h.holder_name for h in self.holders]
        if len(holder_names) != len(set(holder_names)):
            raise ValueError("Holder names must be unique")

        return self


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
