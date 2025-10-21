"""Integration tests for calculation service with various scenarios."""

from decimal import Decimal

import pytest

from app.services.calculation_service import ProfitShareCalculationService
from tests.fixtures import TestFixtures


class TestCalculationIntegration:
    """Integration tests for profit share calculation service."""

    @pytest.fixture
    def calc_service(self) -> ProfitShareCalculationService:
        """Create calculation service instance."""
        return ProfitShareCalculationService()

    def test_basic_period_calculation(
        self, calc_service: ProfitShareCalculationService, test_fixtures: TestFixtures
    ) -> None:
        """Test basic period calculation with positive pool."""
        fixture = test_fixtures.basic_period()

        result = calc_service.calculate_period(
            period_data=fixture["period"],
            holders=fixture["holders"],
            prior_carry_forwards=None,
        )

        # Verify period-level calculations
        assert result.period.adjusted_pool == fixture["expected"]["adjusted_pool"]
        assert result.period.total_shares == fixture["expected"]["total_shares"]

        # Verify holder allocations
        for allocation in result.allocations:
            expected = fixture["expected"]["allocations"][allocation.holder_name]
            assert allocation.gross_allocation == expected["gross"]
            assert allocation.net_payout == expected["net_payout"]
            assert allocation.carry_forward_out == expected["carry_forward_out"]
            assert allocation.carry_forward_in == Decimal("0")

    def test_negative_pool_calculation(
        self, calc_service: ProfitShareCalculationService, test_fixtures: TestFixtures
    ) -> None:
        """Test calculation with negative adjusted pool (loss scenario)."""
        fixture = test_fixtures.negative_pool()

        result = calc_service.calculate_period(
            period_data=fixture["period"],
            holders=fixture["holders"],
            prior_carry_forwards=None,
        )

        # Verify negative pool
        assert result.period.adjusted_pool == fixture["expected"]["adjusted_pool"]
        assert result.period.adjusted_pool < 0

        # Verify all payouts are zero and carry-forwards are generated
        for allocation in result.allocations:
            expected = fixture["expected"]["allocations"][allocation.holder_name]
            assert allocation.net_payout == Decimal("0")
            assert allocation.carry_forward_out == expected["carry_forward_out"]
            assert allocation.carry_forward_out > 0

    def test_zero_shares_validation(
        self, calc_service: ProfitShareCalculationService, test_fixtures: TestFixtures
    ) -> None:
        """Test that zero shares with positive pool raises validation error."""
        fixture = test_fixtures.zero_shares()

        with pytest.raises(ValueError, match="Total shares must be greater than 0"):
            calc_service.calculate_period(
                period_data=fixture["period"],
                holders=fixture["holders"],
                prior_carry_forwards=None,
            )

    def test_high_personal_charges(
        self, calc_service: ProfitShareCalculationService, test_fixtures: TestFixtures
    ) -> None:
        """Test scenario where personal charges exceed gross allocation."""
        fixture = test_fixtures.high_personal_charges()

        result = calc_service.calculate_period(
            period_data=fixture["period"],
            holders=fixture["holders"],
            prior_carry_forwards=None,
        )

        # Verify adjusted pool includes personal addback
        assert result.period.adjusted_pool == fixture["expected"]["adjusted_pool"]

        # Verify holder with high charges gets zero payout and carry-forward
        holder_a = next(a for a in result.allocations if a.holder_name == "Holder A")
        assert holder_a.net_payout == Decimal("0")
        assert holder_a.carry_forward_out > Decimal("0")

        # Verify other holder gets normal payout
        holder_b = next(a for a in result.allocations if a.holder_name == "Holder B")
        assert holder_b.net_payout > Decimal("0")
        assert holder_b.carry_forward_out == Decimal("0")

    def test_carry_forward_propagation(
        self, calc_service: ProfitShareCalculationService, test_fixtures: TestFixtures
    ) -> None:
        """Test carry-forward generation and application across periods."""
        period1, period2 = test_fixtures.carry_forward_scenario()

        # Calculate period 1
        result1 = calc_service.calculate_period(
            period_data=period1["period"],
            holders=period1["holders"],
            prior_carry_forwards=None,
        )

        # Verify period 1 generates carry-forwards
        alice1 = next(a for a in result1.allocations if a.holder_name == "Alice")
        bob1 = next(a for a in result1.allocations if a.holder_name == "Bob")

        assert alice1.carry_forward_out > Decimal("0")
        assert bob1.carry_forward_out == Decimal("0")

        # Build carry-forwards dict for period 2
        carry_forwards = {
            "Alice": alice1.carry_forward_out,
            "Bob": bob1.carry_forward_out,
        }

        # Calculate period 2 with carry-forwards
        result2 = calc_service.calculate_period(
            period_data=period2["period"],
            holders=period2["holders"],
            prior_carry_forwards=carry_forwards,
        )

        # Verify period 2 applies carry-forwards
        alice2 = next(a for a in result2.allocations if a.holder_name == "Alice")
        bob2 = next(a for a in result2.allocations if a.holder_name == "Bob")

        assert alice2.carry_forward_in == alice1.carry_forward_out
        assert bob2.carry_forward_in == Decimal("0")

        # Verify Alice's payout is reduced by carry-forward
        expected_alice = period2["expected"]["allocations"]["Alice"]
        assert alice2.carry_forward_in == expected_alice["carry_forward_in"]

    def test_rounding_reconciliation(
        self, calc_service: ProfitShareCalculationService, test_fixtures: TestFixtures
    ) -> None:
        """Test rounding reconciliation with values that create rounding differences."""
        fixture = test_fixtures.rounding_edge_case()

        result = calc_service.calculate_period(
            period_data=fixture["period"],
            holders=fixture["holders"],
            prior_carry_forwards=None,
        )

        # Verify rounding delta exists
        assert fixture["expected"]["has_rounding_delta"]

        # Verify total payouts equal rounded pool
        total_payouts = sum(a.net_payout for a in result.allocations)
        rounded_pool = result.period.adjusted_pool.quantize(Decimal("0.01"))

        # Should be equal within 1 cent tolerance
        assert abs(total_payouts - rounded_pool) <= Decimal("0.01")

        # Verify one holder received rounding adjustment
        adjusted_holders = [a for a in result.allocations if a.received_rounding_adjustment]
        assert len(adjusted_holders) == 1

    def test_special_adjustments(
        self, calc_service: ProfitShareCalculationService, test_fixtures: TestFixtures
    ) -> None:
        """Test all special adjustment types (uncollectible, bad debt, tax optimization)."""
        fixture = test_fixtures.special_adjustments()

        result = calc_service.calculate_period(
            period_data=fixture["period"],
            holders=fixture["holders"],
            prior_carry_forwards=None,
        )

        # Verify adjusted pool calculation includes all adjustments
        expected_pool = fixture["expected"]["adjusted_pool"]
        assert result.period.adjusted_pool == expected_pool

        # Verify formula: NI + ps_addback + personal - draws - uncollectible + bad_debt - tax_opt
        period = fixture["period"]
        calculated_pool = (
            period.net_income_qb
            + period.ps_addback
            + Decimal("0")  # personal addback
            - period.owner_draws
            - period.uncollectible
            + period.bad_debt
            - period.tax_optimization
        )
        assert result.period.adjusted_pool == calculated_pool

    def test_multiple_holders_complex(
        self, calc_service: ProfitShareCalculationService, test_fixtures: TestFixtures
    ) -> None:
        """Test complex scenario with multiple holders and various conditions."""
        fixture = test_fixtures.multiple_holders_complex()

        result = calc_service.calculate_period(
            period_data=fixture["period"],
            holders=fixture["holders"],
            prior_carry_forwards=fixture.get("prior_carry_forwards"),
        )

        # Verify basic calculations
        assert result.period.adjusted_pool == fixture["expected"]["adjusted_pool"]
        assert result.period.total_shares == fixture["expected"]["total_shares"]
        assert len(result.allocations) == 4

        # Verify all holders are present
        holder_names = {a.holder_name for a in result.allocations}
        assert holder_names == {"Alice", "Bob", "Charlie", "Diana"}

        # Verify carry-forwards were applied
        alice = next(a for a in result.allocations if a.holder_name == "Alice")
        charlie = next(a for a in result.allocations if a.holder_name == "Charlie")
        assert alice.carry_forward_in == Decimal("5000.00")
        assert charlie.carry_forward_in == Decimal("8000.00")

        # Verify total payouts don't exceed adjusted pool
        total_payouts = sum(a.net_payout for a in result.allocations)
        assert total_payouts <= result.period.adjusted_pool

    def test_year_boundary_carry_forward(
        self, calc_service: ProfitShareCalculationService, test_fixtures: TestFixtures
    ) -> None:
        """Test carry-forward across year boundary (December to January)."""
        period_dec, period_jan = test_fixtures.year_boundary_carry_forward()

        # Calculate December period
        result_dec = calc_service.calculate_period(
            period_data=period_dec["period"],
            holders=period_dec["holders"],
            prior_carry_forwards=None,
        )

        # Verify December generates carry-forward
        holder_dec = result_dec.allocations[0]
        assert holder_dec.carry_forward_out > Decimal("0")

        # Calculate January period with carry-forward
        carry_forwards = {"Holder A": holder_dec.carry_forward_out}

        result_jan = calc_service.calculate_period(
            period_data=period_jan["period"],
            holders=period_jan["holders"],
            prior_carry_forwards=carry_forwards,
        )

        # Verify January applies carry-forward
        holder_jan = result_jan.allocations[0]
        assert holder_jan.carry_forward_in == holder_dec.carry_forward_out
        assert holder_jan.net_payout == period_jan["expected"]["allocations"]["Holder A"]["net_payout"]

    def test_zero_pool_with_zero_shares(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Test that zero pool with zero shares is handled gracefully."""
        from app.schemas.period import HolderInput, PeriodInput

        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("0.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Holder A", shares=0, personal_charges=Decimal("0.00")),
        ]

        # Should not raise error for zero pool with zero shares
        result = calc_service.calculate_period(
            period_data=period_data,
            holders=holders,
            prior_carry_forwards=None,
        )

        assert result.period.adjusted_pool == Decimal("0.00")
        assert result.period.total_shares == 0
        assert result.allocations[0].net_payout == Decimal("0.00")

    def test_personal_addback_calculation(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Test that personal charges are properly added back to the pool."""
        from app.schemas.period import HolderInput, PeriodInput

        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Holder A", shares=50, personal_charges=Decimal("10000.00")),
            HolderInput(holder_name="Holder B", shares=50, personal_charges=Decimal("5000.00")),
        ]

        result = calc_service.calculate_period(
            period_data=period_data,
            holders=holders,
            prior_carry_forwards=None,
        )

        # Pool should include personal addback: 100,000 + 15,000 = 115,000
        assert result.period.adjusted_pool == Decimal("115000.00")

        # Each holder gets 50% of pool minus their charges
        holder_a = next(a for a in result.allocations if a.holder_name == "Holder A")
        holder_b = next(a for a in result.allocations if a.holder_name == "Holder B")

        assert holder_a.gross_allocation == Decimal("57500.00")
        assert holder_b.gross_allocation == Decimal("57500.00")
        assert holder_a.net_payout == Decimal("47500.00")  # 57,500 - 10,000
        assert holder_b.net_payout == Decimal("52500.00")  # 57,500 - 5,000
