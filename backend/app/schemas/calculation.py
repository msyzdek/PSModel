"""Pydantic schemas for calculation results."""

from decimal import Decimal

from pydantic import BaseModel, Field


class HolderAllocationResult(BaseModel):
    """Schema for individual holder allocation result."""

    holder_name: str = Field(..., description="Name of the holder")
    shares: int = Field(..., description="Number of shares held")
    gross_allocation: Decimal = Field(..., description="Gross allocation before charges")
    personal_charges: Decimal = Field(..., description="Personal charges deducted")
    carry_forward_in: Decimal = Field(..., description="Carry-forward from previous period")
    net_payout: Decimal = Field(..., description="Final net payout amount")
    carry_forward_out: Decimal = Field(..., description="Carry-forward to next period")
    received_rounding_adjustment: bool = Field(
        ..., description="Whether this holder received rounding adjustment"
    )

    class Config:
        """Pydantic config."""

        from_attributes = True
        json_schema_extra = {
            "example": {
                "holder_name": "John Doe",
                "shares": 100,
                "gross_allocation": 9500.00,
                "personal_charges": 500.00,
                "carry_forward_in": 0.00,
                "net_payout": 9000.00,
                "carry_forward_out": 0.00,
                "received_rounding_adjustment": True,
            }
        }


class PeriodData(BaseModel):
    """Schema for period data in calculation result."""

    year: int = Field(..., description="Year of the period")
    month: int = Field(..., description="Month of the period")
    net_income_qb: Decimal = Field(..., description="QuickBooks Net Income")
    ps_addback: Decimal = Field(..., description="PS payout add-back")
    owner_draws: Decimal = Field(..., description="Total owner draws")
    uncollectible: Decimal = Field(default=Decimal("0"), description="Uncollectible income")
    bad_debt: Decimal = Field(default=Decimal("0"), description="Bad debt")
    tax_optimization: Decimal = Field(default=Decimal("0"), description="Tax optimization return")
    adjusted_pool: Decimal = Field(..., description="Adjusted profit pool")
    total_shares: int = Field(..., description="Total shares across all holders")
    rounding_delta: Decimal = Field(..., description="Rounding adjustment applied")

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
                "adjusted_pool": 95000.00,
                "total_shares": 1000,
                "rounding_delta": 0.02,
            }
        }


class CalculationResult(BaseModel):
    """Schema for complete calculation result."""

    period: PeriodData = Field(..., description="Period summary data")
    allocations: list[HolderAllocationResult] = Field(
        ..., description="List of holder allocations"
    )

    class Config:
        """Pydantic config."""

        json_schema_extra = {
            "example": {
                "period": {
                    "year": 2024,
                    "month": 1,
                    "adjusted_pool": 95000.00,
                    "total_shares": 1000,
                    "rounding_delta": 0.02,
                },
                "allocations": [
                    {
                        "holder_name": "John Doe",
                        "shares": 100,
                        "gross_allocation": 9500.00,
                        "personal_charges": 500.00,
                        "carry_forward_in": 0.00,
                        "net_payout": 9000.00,
                        "carry_forward_out": 0.00,
                        "received_rounding_adjustment": True,
                    }
                ],
            }
        }
