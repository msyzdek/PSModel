"""API endpoints for calculation operations."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.calculation import CalculationResult, HolderAllocationResult, PeriodData
from app.schemas.period import HolderInput, PeriodInput, PeriodSummary
from app.services.calculation_service import ProfitShareCalculationService
from app.services.period_service import PeriodService

router = APIRouter(prefix="/api", tags=["calculations"])


def get_period_service(db: Annotated[Session, Depends(get_db)]) -> PeriodService:
    """Dependency to get period service instance."""
    return PeriodService(db)


def get_calculation_service() -> ProfitShareCalculationService:
    """Dependency to get calculation service instance."""
    return ProfitShareCalculationService()


@router.post("/calculate/preview", response_model=CalculationResult)
def preview_calculation(
    period_data: PeriodInput,
    holders: list[HolderInput],
    service: Annotated[PeriodService, Depends(get_period_service)],
    calc_service: Annotated[
        ProfitShareCalculationService, Depends(get_calculation_service)
    ],
) -> CalculationResult:
    """
    Preview calculation without saving to database.

    This endpoint runs the calculation logic but does not persist the results.
    Useful for validating inputs and previewing results before committing.

    Args:
        period_data: Period input data
        holders: List of holder allocations
        service: Period service instance (for carry-forward lookup)
        calc_service: Calculation service instance

    Returns:
        CalculationResult: Complete calculation result with period and allocations

    Raises:
        HTTPException: 400 if validation fails, 422 if calculation fails
    """
    try:
        # Get prior period for carry-forwards
        prior_period = service.get_prior_period(period_data.year, period_data.month)
        prior_carry_forwards = None
        if prior_period:
            prior_carry_forwards = service.holder_repo.find_carry_forwards(prior_period.id)

        # Run calculation without saving
        calc_result = calc_service.calculate_period(
            period_data, holders, prior_carry_forwards
        )

        return calc_result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Calculation failed: {str(e)}",
        )


@router.get("/periods/{year}/{month}/summary", response_model=dict)
def get_period_summary(
    year: int,
    month: int,
    service: Annotated[PeriodService, Depends(get_period_service)],
) -> dict:
    """
    Get comprehensive period summary report.

    This endpoint returns a detailed breakdown including:
    - Pool build-up components
    - Adjusted pool and total shares
    - Per-holder allocations with all details
    - Carry-forward movements
    - Rounding reconciliation details

    Args:
        year: Year of the period
        month: Month of the period (1-12)
        service: Period service instance

    Returns:
        dict: Comprehensive period summary with all calculation details

    Raises:
        HTTPException: 404 if period not found
    """
    period = service.get_period(year, month)
    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Period for {year}-{month:02d} not found",
        )

    # Calculate personal addback total
    personal_addback_total = sum(alloc.personal_charges for alloc in period.allocations)

    # Build pool breakdown
    pool_breakdown = {
        "net_income_qb": float(period.net_income_qb),
        "ps_addback": float(period.ps_addback),
        "personal_addback_total": float(personal_addback_total),
        "owner_draws": float(period.owner_draws),
        "uncollectible": float(period.uncollectible),
        "bad_debt": float(period.bad_debt),
        "tax_optimization": float(period.tax_optimization),
        "adjusted_pool": float(period.adjusted_pool),
    }

    # Build allocations with all details
    allocations = [
        {
            "holder_name": alloc.holder_name,
            "shares": alloc.shares,
            "gross_allocation": float(alloc.gross_allocation),
            "personal_charges": float(alloc.personal_charges),
            "carry_forward_in": float(alloc.carry_forward_in),
            "net_payout": float(alloc.net_payout),
            "carry_forward_out": float(alloc.carry_forward_out),
            "received_rounding_adjustment": alloc.received_rounding_adjustment,
        }
        for alloc in period.allocations
    ]

    # Calculate totals
    totals = {
        "total_shares": period.total_shares,
        "total_gross_allocation": float(
            sum(alloc.gross_allocation for alloc in period.allocations)
        ),
        "total_personal_charges": float(personal_addback_total),
        "total_carry_forward_in": float(
            sum(alloc.carry_forward_in for alloc in period.allocations)
        ),
        "total_net_payout": float(sum(alloc.net_payout for alloc in period.allocations)),
        "total_carry_forward_out": float(
            sum(alloc.carry_forward_out for alloc in period.allocations)
        ),
    }

    # Rounding details
    rounding_details = {
        "rounding_delta": float(period.rounding_delta),
        "holder_with_adjustment": next(
            (
                alloc.holder_name
                for alloc in period.allocations
                if alloc.received_rounding_adjustment
            ),
            None,
        ),
    }

    return {
        "period": {
            "year": period.year,
            "month": period.month,
            "created_at": period.created_at.isoformat(),
            "updated_at": period.updated_at.isoformat(),
        },
        "pool_breakdown": pool_breakdown,
        "allocations": allocations,
        "totals": totals,
        "rounding_details": rounding_details,
    }
