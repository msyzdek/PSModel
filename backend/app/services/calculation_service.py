"""Profit share calculation service."""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from app.schemas.calculation import CalculationResult, HolderAllocationResult, PeriodData
from app.schemas.period import HolderInput, PeriodInput


class ProfitShareCalculationService:
    """Service for calculating profit share distributions."""

    def calculate_period(
        self,
        period_data: PeriodInput,
        holders: list[HolderInput],
        prior_carry_forwards: Optional[dict[str, Decimal]] = None,
    ) -> CalculationResult:
        """
        Calculate profit share for a period.

        This is the main orchestration method that executes the complete calculation flow:
        1. Calculate personal_addback_total
        2. Calculate adjusted_pool
        3. Calculate total_shares
        4. Calculate per-holder gross allocations
        5. Apply personal charges
        6. Load and apply carry-forwards from prior period
        7. Apply zero floor and generate new carry-forwards
        8. Round payouts and reconcile
        9. Return complete calculation result

        Args:
            period_data: Input data for the period
            holders: List of holder input data
            prior_carry_forwards: Optional dict of carry-forward amounts from prior period

        Returns:
            CalculationResult with period data and holder allocations

        Raises:
            ValueError: If validation fails (e.g., total_shares = 0 with positive pool)
        """
        # Step 1: Calculate personal addback total
        personal_addback_total = self.calculate_personal_addback_total(holders)

        # Step 2: Calculate adjusted pool
        adjusted_pool = self.calculate_adjusted_pool(
            net_income_qb=period_data.net_income_qb,
            ps_addback=period_data.ps_addback,
            personal_addback_total=personal_addback_total,
            owner_draws=period_data.owner_draws,
            uncollectible=period_data.uncollectible,
            bad_debt=period_data.bad_debt,
            tax_optimization=period_data.tax_optimization,
        )

        # Step 3: Calculate total shares
        total_shares = sum(holder.shares for holder in holders)

        # Validate: if adjusted_pool > 0, total_shares must be > 0
        if adjusted_pool > 0 and total_shares == 0:
            raise ValueError("Total shares must be greater than 0 when adjusted pool is positive")

        # Step 4: Calculate gross allocations
        gross_allocations = self.calculate_gross_allocations(adjusted_pool, holders, total_shares)

        # Step 5: Apply personal charges
        after_charges = self.apply_personal_charges(gross_allocations, holders)

        # Step 6: Load and apply carry-forwards
        carry_forward_in = self.load_carry_forwards(prior_carry_forwards)
        payout_raw = self.apply_carry_forwards(after_charges, carry_forward_in, holders)

        # Step 7: Apply zero floor
        payouts, carry_forward_out = self.apply_zero_floor(payout_raw, holders)

        # Step 8: Round and reconcile
        rounded_payouts, rounding_delta, adjusted_holder_name = self.round_and_reconcile(
            payouts, adjusted_pool, holders
        )

        # Step 9: Build result
        allocations: list[HolderAllocationResult] = []
        for holder in holders:
            allocation = HolderAllocationResult(
                holder_name=holder.holder_name,
                shares=holder.shares,
                gross_allocation=gross_allocations[holder.holder_name],
                personal_charges=holder.personal_charges,
                carry_forward_in=carry_forward_in.get(holder.holder_name, Decimal("0")),
                net_payout=rounded_payouts[holder.holder_name],
                carry_forward_out=carry_forward_out[holder.holder_name],
                received_rounding_adjustment=(holder.holder_name == adjusted_holder_name),
            )
            allocations.append(allocation)

        period = PeriodData(
            year=period_data.year,
            month=period_data.month,
            adjusted_pool=adjusted_pool,
            total_shares=total_shares,
            rounding_delta=rounding_delta,
        )

        return CalculationResult(period=period, allocations=allocations)

    def calculate_personal_addback_total(self, holders: list[HolderInput]) -> Decimal:
        """
        Calculate total personal charges across all holders.

        Args:
            holders: List of holder input data

        Returns:
            Total personal charges as Decimal
        """
        return sum((holder.personal_charges for holder in holders), Decimal("0"))

    def calculate_adjusted_pool(
        self,
        net_income_qb: Decimal,
        ps_addback: Decimal,
        personal_addback_total: Decimal,
        owner_draws: Decimal,
        uncollectible: Decimal,
        bad_debt: Decimal,
        tax_optimization: Decimal,
    ) -> Decimal:
        """
        Calculate adjusted profit pool.

        Formula: NI + ps_addback + personal_total - draws - uncollectible - tax_opt + bad_debt

        Args:
            net_income_qb: QuickBooks Net Income
            ps_addback: PS payout add-back
            personal_addback_total: Total personal charges
            owner_draws: Total owner draws
            uncollectible: Uncollectible income amount
            bad_debt: Bad debt amount
            tax_optimization: Tax optimization return amount

        Returns:
            Adjusted pool as Decimal
        """
        adjusted_pool = (
            net_income_qb
            + ps_addback
            + personal_addback_total
            - owner_draws
            - uncollectible
            - tax_optimization
            + bad_debt
        )
        return adjusted_pool

    def calculate_gross_allocations(
        self, adjusted_pool: Decimal, holders: list[HolderInput], total_shares: int
    ) -> dict[str, Decimal]:
        """
        Calculate gross allocations for each holder based on their share proportion.

        Formula: gross_allocation(holder) = adjusted_pool * shares(holder) / total_shares

        Args:
            adjusted_pool: The adjusted profit pool
            holders: List of holder input data
            total_shares: Total shares across all holders

        Returns:
            Dictionary mapping holder_name to gross_allocation
        """
        gross_allocations: dict[str, Decimal] = {}

        if total_shares == 0:
            # If no shares, no allocations
            for holder in holders:
                gross_allocations[holder.holder_name] = Decimal("0")
            return gross_allocations

        for holder in holders:
            # Calculate proportional allocation
            gross_allocation = (adjusted_pool * Decimal(holder.shares)) / Decimal(total_shares)
            gross_allocations[holder.holder_name] = gross_allocation

        return gross_allocations

    def apply_personal_charges(
        self,
        gross_allocations: dict[str, Decimal],
        holders: list[HolderInput],
    ) -> dict[str, Decimal]:
        """
        Apply personal charges to gross allocations.

        Formula: after_charges(holder) = gross_allocation(holder) - personal_charges(holder)

        Args:
            gross_allocations: Dictionary of gross allocations by holder name
            holders: List of holder input data

        Returns:
            Dictionary mapping holder_name to amount after personal charges
        """
        after_charges: dict[str, Decimal] = {}

        for holder in holders:
            gross = gross_allocations.get(holder.holder_name, Decimal("0"))
            after_charges[holder.holder_name] = gross - holder.personal_charges

        return after_charges

    def load_carry_forwards(
        self, prior_carry_forwards: Optional[dict[str, Decimal]]
    ) -> dict[str, Decimal]:
        """
        Load carry-forward amounts from prior period.

        Args:
            prior_carry_forwards: Dictionary of carry-forward amounts by holder name
                                 from the prior period, or None if no prior period

        Returns:
            Dictionary mapping holder_name to carry_forward_in amount
        """
        if prior_carry_forwards is None:
            return {}
        return prior_carry_forwards.copy()

    def apply_carry_forwards(
        self,
        after_charges: dict[str, Decimal],
        carry_forward_in: dict[str, Decimal],
        holders: list[HolderInput],
    ) -> dict[str, Decimal]:
        """
        Apply carry-forward amounts to current period calculations.

        Formula: payout_raw(holder) = after_charges(holder) - carry_forward_in(holder)

        Args:
            after_charges: Dictionary of amounts after personal charges
            carry_forward_in: Dictionary of carry-forward amounts from prior period
            holders: List of holder input data

        Returns:
            Dictionary mapping holder_name to raw payout (before zero floor)
        """
        payout_raw: dict[str, Decimal] = {}

        for holder in holders:
            after_charge = after_charges.get(holder.holder_name, Decimal("0"))
            carry_in = carry_forward_in.get(holder.holder_name, Decimal("0"))
            payout_raw[holder.holder_name] = after_charge - carry_in

        return payout_raw

    def apply_zero_floor(
        self, payout_raw: dict[str, Decimal], holders: list[HolderInput]
    ) -> tuple[dict[str, Decimal], dict[str, Decimal]]:
        """
        Apply zero floor logic and generate carry-forward amounts.

        Rules:
        - If payout_raw < 0: payout = 0, carry_forward_out = abs(payout_raw)
        - If payout_raw >= 0: payout = payout_raw, carry_forward_out = 0

        Args:
            payout_raw: Dictionary of raw payout amounts (can be negative)
            holders: List of holder input data

        Returns:
            Tuple of (payouts, carry_forward_out) dictionaries
        """
        payouts: dict[str, Decimal] = {}
        carry_forward_out: dict[str, Decimal] = {}

        for holder in holders:
            raw = payout_raw.get(holder.holder_name, Decimal("0"))

            if raw < 0:
                # Negative payout: set to zero and carry forward the deficit
                payouts[holder.holder_name] = Decimal("0")
                carry_forward_out[holder.holder_name] = abs(raw)
            else:
                # Zero or positive payout: use as-is, no carry forward
                payouts[holder.holder_name] = raw
                carry_forward_out[holder.holder_name] = Decimal("0")

        return payouts, carry_forward_out

    def round_half_up(self, value: Decimal) -> Decimal:
        """
        Round a decimal value to 2 decimal places using round-half-up method.

        Args:
            value: Decimal value to round

        Returns:
            Rounded decimal value
        """
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def round_and_reconcile(
        self,
        payouts: dict[str, Decimal],
        adjusted_pool: Decimal,
        holders: list[HolderInput],
    ) -> tuple[dict[str, Decimal], Decimal, Optional[str]]:
        """
        Round all payouts to cents and reconcile the rounding delta.

        Process:
        1. Round each payout to cents using round-half-up
        2. Calculate rounding delta (rounded_total - unrounded_total)
        3. Find holder with largest positive payout
        4. Adjust that holder's payout by the delta

        Note: Payouts may not equal the adjusted pool because:
        - Personal charges reduce payouts below gross allocations
        - Carry-forwards reduce payouts
        - Zero floor prevents negative payouts

        Args:
            payouts: Dictionary of unrounded payout amounts
            adjusted_pool: The adjusted profit pool
            holders: List of holder input data

        Returns:
            Tuple of (rounded_payouts, rounding_delta, adjusted_holder_name)
        """
        # Round each payout
        rounded_payouts: dict[str, Decimal] = {}
        for holder_name, payout in payouts.items():
            rounded_payouts[holder_name] = self.round_half_up(payout)

        # Calculate unrounded and rounded totals
        unrounded_total = sum(payouts.values(), Decimal("0"))
        rounded_total = sum(rounded_payouts.values(), Decimal("0"))

        # Calculate rounding delta
        rounding_delta = rounded_total - unrounded_total

        # Find holder with largest positive payout to apply adjustment
        adjusted_holder_name: Optional[str] = None
        if rounding_delta != 0:
            # Find holder with largest positive rounded payout
            max_payout = Decimal("-999999999")
            for holder in holders:
                holder_payout = rounded_payouts.get(holder.holder_name, Decimal("0"))
                if holder_payout > max_payout:
                    max_payout = holder_payout
                    adjusted_holder_name = holder.holder_name

            # Apply adjustment to that holder
            if adjusted_holder_name is not None:
                rounded_payouts[adjusted_holder_name] -= rounding_delta

        return rounded_payouts, rounding_delta, adjusted_holder_name

