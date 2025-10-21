"""API endpoints for period CRUD operations."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import CurrentUser
from app.schemas.calculation import CalculationResult, HolderAllocationResult, PeriodData
from app.schemas.period import HolderInput, PeriodCreateRequest, PeriodInput, PeriodSummary
from app.services.period_service import PeriodService

router = APIRouter(prefix="/api/periods", tags=["periods"])


def get_period_service(db: Annotated[Session, Depends(get_db)]) -> PeriodService:
    """Dependency to get period service instance."""
    return PeriodService(db)


@router.post("", response_model=CalculationResult, status_code=status.HTTP_201_CREATED)
def create_period(
    request: PeriodCreateRequest,
    service: Annotated[PeriodService, Depends(get_period_service)],
    current_user: CurrentUser,
) -> CalculationResult:
    """
    Create a new period with calculations.

    Args:
        request: Period creation request with period data and holders
        service: Period service instance

    Returns:
        CalculationResult: Complete calculation result with period and allocations

    Raises:
        HTTPException: 400 if period already exists or validation fails
    """
    try:
        period = service.create_period(request.period, request.holders)

        # Convert to CalculationResult
        return CalculationResult(
            period=PeriodData(
                year=period.year,
                month=period.month,
                adjusted_pool=period.adjusted_pool,
                total_shares=period.total_shares,
                rounding_delta=period.rounding_delta,
            ),
            allocations=[
                HolderAllocationResult(
                    holder_name=alloc.holder_name,
                    shares=alloc.shares,
                    gross_allocation=alloc.gross_allocation,
                    personal_charges=alloc.personal_charges,
                    carry_forward_in=alloc.carry_forward_in,
                    net_payout=alloc.net_payout,
                    carry_forward_out=alloc.carry_forward_out,
                    received_rounding_adjustment=alloc.received_rounding_adjustment,
                )
                for alloc in period.allocations
            ],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[PeriodSummary])
def list_periods(
    limit: int = 12,
    service: Annotated[PeriodService, Depends(get_period_service)],
    current_user: CurrentUser,
) -> list[PeriodSummary]:
    """
    List all periods ordered by most recent first.

    Args:
        limit: Maximum number of periods to return (default: 12)
        service: Period service instance

    Returns:
        list[PeriodSummary]: List of period summaries
    """
    periods = service.list_periods(limit)
    return [
        PeriodSummary(
            id=period.id,
            year=period.year,
            month=period.month,
            net_income_qb=period.net_income_qb,
            ps_addback=period.ps_addback,
            owner_draws=period.owner_draws,
            uncollectible=period.uncollectible,
            bad_debt=period.bad_debt,
            tax_optimization=period.tax_optimization,
            adjusted_pool=period.adjusted_pool,
            total_shares=period.total_shares,
            rounding_delta=period.rounding_delta,
            created_at=period.created_at.isoformat(),
            updated_at=period.updated_at.isoformat(),
        )
        for period in periods
    ]


@router.get("/{year}/{month}", response_model=CalculationResult)
def get_period(
    year: int,
    month: int,
    service: Annotated[PeriodService, Depends(get_period_service)],
    current_user: CurrentUser,
) -> CalculationResult:
    """
    Get a specific period by year and month.

    Args:
        year: Year of the period
        month: Month of the period (1-12)
        service: Period service instance

    Returns:
        CalculationResult: Complete calculation result with period and allocations

    Raises:
        HTTPException: 404 if period not found
    """
    period = service.get_period(year, month)
    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Period for {year}-{month:02d} not found",
        )

    return CalculationResult(
        period=PeriodData(
            year=period.year,
            month=period.month,
            adjusted_pool=period.adjusted_pool,
            total_shares=period.total_shares,
            rounding_delta=period.rounding_delta,
        ),
        allocations=[
            HolderAllocationResult(
                holder_name=alloc.holder_name,
                shares=alloc.shares,
                gross_allocation=alloc.gross_allocation,
                personal_charges=alloc.personal_charges,
                carry_forward_in=alloc.carry_forward_in,
                net_payout=alloc.net_payout,
                carry_forward_out=alloc.carry_forward_out,
                received_rounding_adjustment=alloc.received_rounding_adjustment,
            )
            for alloc in period.allocations
        ],
    )


@router.put("/{year}/{month}", response_model=CalculationResult)
def update_period(
    year: int,
    month: int,
    request: PeriodCreateRequest,
    service: Annotated[PeriodService, Depends(get_period_service)],
    current_user: CurrentUser,
) -> CalculationResult:
    """
    Update an existing period and recalculate.

    Args:
        year: Year of the period to update
        month: Month of the period to update
        request: Period update request with period data and holders
        service: Period service instance

    Returns:
        CalculationResult: Complete calculation result with updated period and allocations

    Raises:
        HTTPException: 404 if period not found, 400 if validation fails
    """
    try:
        period = service.update_period(year, month, request.period, request.holders)

        return CalculationResult(
            period=PeriodData(
                year=period.year,
                month=period.month,
                adjusted_pool=period.adjusted_pool,
                total_shares=period.total_shares,
                rounding_delta=period.rounding_delta,
            ),
            allocations=[
                HolderAllocationResult(
                    holder_name=alloc.holder_name,
                    shares=alloc.shares,
                    gross_allocation=alloc.gross_allocation,
                    personal_charges=alloc.personal_charges,
                    carry_forward_in=alloc.carry_forward_in,
                    net_payout=alloc.net_payout,
                    carry_forward_out=alloc.carry_forward_out,
                    received_rounding_adjustment=alloc.received_rounding_adjustment,
                )
                for alloc in period.allocations
            ],
        )
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.delete("/{year}/{month}", status_code=status.HTTP_204_NO_CONTENT)
def delete_period(
    year: int,
    month: int,
    service: Annotated[PeriodService, Depends(get_period_service)],
    current_user: CurrentUser,
) -> None:
    """
    Delete a period.

    Args:
        year: Year of the period to delete
        month: Month of the period to delete
        service: Period service instance

    Raises:
        HTTPException: 404 if period not found
    """
    period = service.get_period(year, month)
    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Period for {year}-{month:02d} not found",
        )

    service.period_repo.delete(period.id)
