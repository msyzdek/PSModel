"""Service for managing monthly periods and orchestrating calculations."""

from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.models.holder_allocation import HolderAllocation
from app.models.monthly_period import MonthlyPeriod
from app.repositories.holder_allocation_repository import HolderAllocationRepository
from app.repositories.period_repository import PeriodRepository
from app.schemas.calculation import CalculationResult
from app.schemas.period import HolderInput, PeriodInput
from app.services.calculation_service import ProfitShareCalculationService


class PeriodService:
    """Service for managing monthly periods with calculation orchestration."""

    def __init__(self, db: Session) -> None:
        """
        Initialize service with database session.

        Args:
            db: SQLAlchemy database session
        """
        self.db = db
        self.period_repo = PeriodRepository(db)
        self.holder_repo = HolderAllocationRepository(db)
        self.calc_service = ProfitShareCalculationService()

    def create_period(
        self, period_data: PeriodInput, holders: list[HolderInput]
    ) -> MonthlyPeriod:
        """
        Create a new period with calculations and persist to database.

        This method orchestrates the complete flow:
        1. Check if period already exists
        2. Get prior period for carry-forwards
        3. Run calculation service
        4. Validate results
        5. Create and save period entity
        6. Create and save holder allocation entities
        7. Return saved period with allocations

        Args:
            period_data: Input data for the period
            holders: List of holder input data

        Returns:
            MonthlyPeriod: Created period with allocations

        Raises:
            ValueError: If period already exists or validation fails
        """
        # Check if period already exists
        existing = self.period_repo.find_by_year_month(period_data.year, period_data.month)
        if existing:
            raise ValueError(
                f"Period for {period_data.year}-{period_data.month:02d} already exists"
            )

        # Get prior period for carry-forwards
        prior_period = self.get_prior_period(period_data.year, period_data.month)
        prior_carry_forwards: Optional[dict[str, Decimal]] = None
        if prior_period:
            prior_carry_forwards = self.holder_repo.find_carry_forwards(prior_period.id)

        # Run calculation
        calc_result = self.calc_service.calculate_period(
            period_data, holders, prior_carry_forwards
        )

        # Validate calculation results
        self._validate_calculation_result(calc_result)

        # Create period entity
        period = self._create_period_entity(period_data, calc_result)

        # Save period
        saved_period = self.period_repo.save(period)

        # Create and save holder allocations
        allocations = self._create_allocation_entities(saved_period.id, calc_result)
        self.holder_repo.save_all(allocations)

        # Refresh to load allocations
        self.db.refresh(saved_period)

        return saved_period

    def get_period(self, year: int, month: int) -> Optional[MonthlyPeriod]:
        """
        Get a specific period by year and month with allocations.

        Args:
            year: Year of the period
            month: Month of the period (1-12)

        Returns:
            Optional[MonthlyPeriod]: Period with allocations if found, None otherwise
        """
        return self.period_repo.find_by_year_month(year, month)

    def update_period(
        self, year: int, month: int, period_data: PeriodInput, holders: list[HolderInput]
    ) -> MonthlyPeriod:
        """
        Update an existing period and recalculate.

        This method:
        1. Find existing period
        2. Get prior period for carry-forwards
        3. Run calculation service
        4. Validate results
        5. Update period entity
        6. Delete old allocations
        7. Create and save new allocations
        8. Return updated period

        Args:
            year: Year of the period to update
            month: Month of the period to update
            period_data: Updated input data for the period
            holders: Updated list of holder input data

        Returns:
            MonthlyPeriod: Updated period with allocations

        Raises:
            ValueError: If period not found or validation fails
        """
        # Find existing period
        existing_period = self.period_repo.find_by_year_month(year, month)
        if not existing_period:
            raise ValueError(f"Period for {year}-{month:02d} not found")

        # Get prior period for carry-forwards
        prior_period = self.get_prior_period(period_data.year, period_data.month)
        prior_carry_forwards: Optional[dict[str, Decimal]] = None
        if prior_period:
            prior_carry_forwards = self.holder_repo.find_carry_forwards(prior_period.id)

        # Run calculation
        calc_result = self.calc_service.calculate_period(
            period_data, holders, prior_carry_forwards
        )

        # Validate calculation results
        self._validate_calculation_result(calc_result)

        # Update period entity
        self._update_period_entity(existing_period, period_data, calc_result)

        # Save updated period
        saved_period = self.period_repo.save(existing_period)

        # Delete old allocations
        self.holder_repo.delete_by_period(saved_period.id)

        # Create and save new allocations
        allocations = self._create_allocation_entities(saved_period.id, calc_result)
        self.holder_repo.save_all(allocations)

        # Refresh to load allocations
        self.db.refresh(saved_period)

        return saved_period

    def list_periods(self, limit: int = 12) -> list[MonthlyPeriod]:
        """
        List all periods ordered by most recent first.

        Args:
            limit: Maximum number of periods to return (default: 12)

        Returns:
            list[MonthlyPeriod]: List of periods
        """
        return self.period_repo.find_all(limit)

    def get_prior_period(self, year: int, month: int) -> Optional[MonthlyPeriod]:
        """
        Get the prior period for carry-forward lookup.

        This method finds the period immediately before the given year/month.
        For example:
        - If given 2024-03, returns 2024-02
        - If given 2024-01, returns 2023-12

        Args:
            year: Year of the current period
            month: Month of the current period (1-12)

        Returns:
            Optional[MonthlyPeriod]: Prior period if found, None otherwise
        """
        # Calculate prior year and month
        if month == 1:
            prior_year = year - 1
            prior_month = 12
        else:
            prior_year = year
            prior_month = month - 1

        return self.period_repo.find_by_year_month(prior_year, prior_month)

    def _validate_calculation_result(self, calc_result: CalculationResult) -> None:
        """
        Validate calculation results before saving.

        Args:
            calc_result: Calculation result to validate

        Raises:
            ValueError: If validation fails
        """
        # Validate that we have allocations if we have holders
        if not calc_result.allocations:
            raise ValueError("Calculation result must have at least one allocation")

        # Validate that total shares matches sum of holder shares
        total_shares_from_allocations = sum(
            alloc.shares for alloc in calc_result.allocations
        )
        if total_shares_from_allocations != calc_result.period.total_shares:
            raise ValueError(
                f"Total shares mismatch: {total_shares_from_allocations} != "
                f"{calc_result.period.total_shares}"
            )

    def _create_period_entity(
        self, period_data: PeriodInput, calc_result: CalculationResult
    ) -> MonthlyPeriod:
        """
        Create a MonthlyPeriod entity from input data and calculation result.

        Args:
            period_data: Input data for the period
            calc_result: Calculation result

        Returns:
            MonthlyPeriod: Created period entity (not yet saved)
        """
        return MonthlyPeriod(
            year=period_data.year,
            month=period_data.month,
            net_income_qb=period_data.net_income_qb,
            ps_addback=period_data.ps_addback,
            owner_draws=period_data.owner_draws,
            uncollectible=period_data.uncollectible,
            bad_debt=period_data.bad_debt,
            tax_optimization=period_data.tax_optimization,
            adjusted_pool=calc_result.period.adjusted_pool,
            total_shares=calc_result.period.total_shares,
            rounding_delta=calc_result.period.rounding_delta,
        )

    def _update_period_entity(
        self,
        period: MonthlyPeriod,
        period_data: PeriodInput,
        calc_result: CalculationResult,
    ) -> None:
        """
        Update a MonthlyPeriod entity with new data and calculation result.

        Args:
            period: Existing period entity to update
            period_data: Updated input data
            calc_result: New calculation result
        """
        period.year = period_data.year
        period.month = period_data.month
        period.net_income_qb = period_data.net_income_qb
        period.ps_addback = period_data.ps_addback
        period.owner_draws = period_data.owner_draws
        period.uncollectible = period_data.uncollectible
        period.bad_debt = period_data.bad_debt
        period.tax_optimization = period_data.tax_optimization
        period.adjusted_pool = calc_result.period.adjusted_pool
        period.total_shares = calc_result.period.total_shares
        period.rounding_delta = calc_result.period.rounding_delta

    def _create_allocation_entities(
        self, period_id: int, calc_result: CalculationResult
    ) -> list[HolderAllocation]:
        """
        Create HolderAllocation entities from calculation result.

        Args:
            period_id: ID of the period
            calc_result: Calculation result

        Returns:
            list[HolderAllocation]: List of allocation entities (not yet saved)
        """
        allocations: list[HolderAllocation] = []

        for alloc_result in calc_result.allocations:
            allocation = HolderAllocation(
                period_id=period_id,
                holder_name=alloc_result.holder_name,
                shares=alloc_result.shares,
                personal_charges=alloc_result.personal_charges,
                carry_forward_in=alloc_result.carry_forward_in,
                gross_allocation=alloc_result.gross_allocation,
                net_payout=alloc_result.net_payout,
                carry_forward_out=alloc_result.carry_forward_out,
                received_rounding_adjustment=alloc_result.received_rounding_adjustment,
            )
            allocations.append(allocation)

        return allocations
