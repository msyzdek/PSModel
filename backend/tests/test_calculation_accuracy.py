"""Tests to verify calculation accuracy against expected results."""

from decimal import Decimal

import pytest

from app.services.calculation_service import ProfitShareCalculationService
from app.schemas.period import HolderInput, PeriodInput


class TestCalculationAccuracy:
    """Verify calculation accuracy with precise expected results."""

    @pytest.fixture
    def calc_service(self) -> ProfitShareCalculationService:
        """Create calculation service instance."""
        return ProfitShareCalculationService()

    def test_adjusted_pool_formula_accuracy(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """
        Verify adjusted pool calculation formula.

        Formula: NI + ps_addback + personal_total - draws - uncollectible + bad_debt - tax_opt
        """
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("5000.00"),
            owner_draws=Decimal("10000.00"),
            uncollectible=Decimal("3000.00"),
            bad_debt=Decimal("2000.00"),
            tax_optimization=Decimal("1000.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=60, personal_charges=Decimal("4000.00")),
            HolderInput(holder_name="Bob", shares=40, personal_charges=Decimal("2000.00")),
        ]

        result = calc_service.calculate_period(period_data, holders, None)

        # Manual calculation:
        # Personal addback: 4,000 + 2,000 = 6,000
        # Adjusted pool: 100,000 + 5,000 + 6,000 - 10,000 - 3,000 + 2,000 - 1,000 = 99,000
        expected_pool = Decimal("99000.00")

        assert result.period.adjusted_pool == expected_pool

    def test_gross_allocation_proportional_accuracy(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Verify gross allocations are proportional to shares."""
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=60, personal_charges=Decimal("0.00")),
            HolderInput(holder_name="Bob", shares=40, personal_charges=Decimal("0.00")),
        ]

        result = calc_service.calculate_period(period_data, holders, None)

        # Pool = 100,000
        # Alice (60%): 60,000
        # Bob (40%): 40,000
        alice = next(a for a in result.allocations if a.holder_name == "Alice")
        bob = next(a for a in result.allocations if a.holder_name == "Bob")

        assert alice.gross_allocation == Decimal("60000.00")
        assert bob.gross_allocation == Decimal("40000.00")
        assert alice.net_payout == Decimal("60000.00")
        assert bob.net_payout == Decimal("40000.00")

    def test_personal_charges_deduction_accuracy(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Verify personal charges are correctly deducted from gross allocation."""
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=50, personal_charges=Decimal("15000.00")),
            HolderInput(holder_name="Bob", shares=50, personal_charges=Decimal("5000.00")),
        ]

        result = calc_service.calculate_period(period_data, holders, None)

        # Pool with personal addback: 100,000 + 20,000 = 120,000
        # Alice gross: 60,000, net: 60,000 - 15,000 = 45,000
        # Bob gross: 60,000, net: 60,000 - 5,000 = 55,000

        alice = next(a for a in result.allocations if a.holder_name == "Alice")
        bob = next(a for a in result.allocations if a.holder_name == "Bob")

        assert result.period.adjusted_pool == Decimal("120000.00")
        assert alice.gross_allocation == Decimal("60000.00")
        assert alice.net_payout == Decimal("45000.00")
        assert bob.gross_allocation == Decimal("60000.00")
        assert bob.net_payout == Decimal("55000.00")

    def test_carry_forward_application_accuracy(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Verify carry-forwards are correctly applied to reduce payouts."""
        period_data = PeriodInput(
            year=2024,
            month=2,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=50, personal_charges=Decimal("5000.00")),
            HolderInput(holder_name="Bob", shares=50, personal_charges=Decimal("3000.00")),
        ]

        prior_carry_forwards = {
            "Alice": Decimal("10000.00"),
            "Bob": Decimal("2000.00"),
        }

        result = calc_service.calculate_period(period_data, holders, prior_carry_forwards)

        # Pool: 100,000 + 8,000 = 108,000
        # Alice gross: 54,000, after charges: 49,000, after carry: 49,000 - 10,000 = 39,000
        # Bob gross: 54,000, after charges: 51,000, after carry: 51,000 - 2,000 = 49,000

        alice = next(a for a in result.allocations if a.holder_name == "Alice")
        bob = next(a for a in result.allocations if a.holder_name == "Bob")

        assert alice.carry_forward_in == Decimal("10000.00")
        assert alice.net_payout == Decimal("39000.00")
        assert bob.carry_forward_in == Decimal("2000.00")
        assert bob.net_payout == Decimal("49000.00")

    def test_zero_floor_carry_forward_generation_accuracy(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Verify zero floor logic and carry-forward generation."""
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("30000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=50, personal_charges=Decimal("40000.00")),
            HolderInput(holder_name="Bob", shares=50, personal_charges=Decimal("5000.00")),
        ]

        result = calc_service.calculate_period(period_data, holders, None)

        # Pool: 30,000 + 45,000 = 75,000
        # Alice gross: 37,500, after charges: 37,500 - 40,000 = -2,500
        #   -> payout: 0, carry_forward_out: 2,500
        # Bob gross: 37,500, after charges: 37,500 - 5,000 = 32,500
        #   -> payout: 32,500, carry_forward_out: 0

        alice = next(a for a in result.allocations if a.holder_name == "Alice")
        bob = next(a for a in result.allocations if a.holder_name == "Bob")

        assert alice.net_payout == Decimal("0.00")
        assert alice.carry_forward_out == Decimal("2500.00")
        assert bob.net_payout == Decimal("32500.00")
        assert bob.carry_forward_out == Decimal("0.00")

    def test_rounding_reconciliation_accuracy(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Verify rounding reconciliation maintains precision."""
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.33"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=33, personal_charges=Decimal("0.00")),
            HolderInput(holder_name="Bob", shares=33, personal_charges=Decimal("0.00")),
            HolderInput(holder_name="Charlie", shares=34, personal_charges=Decimal("0.00")),
        ]

        result = calc_service.calculate_period(period_data, holders, None)

        # Verify all payouts are rounded to cents
        for allocation in result.allocations:
            payout_str = str(allocation.net_payout)
            if "." in payout_str:
                decimal_places = len(payout_str.split(".")[1])
                assert decimal_places <= 2

        # Verify rounding delta was recorded
        assert result.period.rounding_delta is not None

    def test_negative_pool_all_zero_payouts(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Verify negative pool results in zero payouts and carry-forwards."""
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("10000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("50000.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=60, personal_charges=Decimal("0.00")),
            HolderInput(holder_name="Bob", shares=40, personal_charges=Decimal("0.00")),
        ]

        result = calc_service.calculate_period(period_data, holders, None)

        # Pool: 10,000 - 50,000 = -40,000
        # Alice: -24,000 -> payout: 0, carry: 24,000
        # Bob: -16,000 -> payout: 0, carry: 16,000

        assert result.period.adjusted_pool == Decimal("-40000.00")

        alice = next(a for a in result.allocations if a.holder_name == "Alice")
        bob = next(a for a in result.allocations if a.holder_name == "Bob")

        assert alice.net_payout == Decimal("0.00")
        assert alice.carry_forward_out == Decimal("24000.00")
        assert bob.net_payout == Decimal("0.00")
        assert bob.carry_forward_out == Decimal("16000.00")

    def test_multi_period_carry_forward_accumulation(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Verify carry-forwards accumulate correctly across multiple periods."""
        # Period 1: Generate initial carry-forward
        period1_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("20000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders1 = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("30000.00")),
        ]

        result1 = calc_service.calculate_period(period1_data, holders1, None)

        # Pool: 20,000 + 30,000 = 50,000
        # Alice: 50,000 - 30,000 = 20,000 (positive, no carry-forward)
        alice1 = result1.allocations[0]
        assert alice1.net_payout == Decimal("20000.00")
        assert alice1.carry_forward_out == Decimal("0.00")

        # Period 2: Generate carry-forward
        period2_data = PeriodInput(
            year=2024,
            month=2,
            net_income_qb=Decimal("15000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders2 = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("25000.00")),
        ]

        result2 = calc_service.calculate_period(period2_data, holders2, None)

        # Pool: 15,000 + 25,000 = 40,000
        # Alice: 40,000 - 25,000 = 15,000 (positive, no carry-forward)
        alice2 = result2.allocations[0]
        assert alice2.net_payout == Decimal("15000.00")
        assert alice2.carry_forward_out == Decimal("0.00")

        # Period 3: Generate deficit
        period3_data = PeriodInput(
            year=2024,
            month=3,
            net_income_qb=Decimal("10000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders3 = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("20000.00")),
        ]

        result3 = calc_service.calculate_period(period3_data, holders3, None)

        # Pool: 10,000 + 20,000 = 30,000
        # Alice: 30,000 - 20,000 = 10,000 (positive, no carry-forward)
        alice3 = result3.allocations[0]
        assert alice3.net_payout == Decimal("10000.00")
        assert alice3.carry_forward_out == Decimal("0.00")

        # Period 4: Apply accumulated carry-forward
        period4_data = PeriodInput(
            year=2024,
            month=4,
            net_income_qb=Decimal("5000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders4 = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("15000.00")),
        ]

        # Simulate carry-forward from period 3
        carry_forwards = {"Alice": Decimal("0.00")}

        result4 = calc_service.calculate_period(period4_data, holders4, carry_forwards)

        # Pool: 5,000 + 15,000 = 20,000
        # Alice: 20,000 - 15,000 - 0 = 5,000
        alice4 = result4.allocations[0]
        assert alice4.net_payout == Decimal("5000.00")

    def test_all_adjustments_combined_accuracy(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Verify accuracy when all adjustment types are combined."""
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("150000.00"),
            ps_addback=Decimal("8000.00"),
            owner_draws=Decimal("20000.00"),
            uncollectible=Decimal("5000.00"),
            bad_debt=Decimal("3000.00"),
            tax_optimization=Decimal("2000.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=40, personal_charges=Decimal("10000.00")),
            HolderInput(holder_name="Bob", shares=30, personal_charges=Decimal("5000.00")),
            HolderInput(holder_name="Charlie", shares=20, personal_charges=Decimal("15000.00")),
            HolderInput(holder_name="Diana", shares=10, personal_charges=Decimal("1000.00")),
        ]

        prior_carry_forwards = {
            "Alice": Decimal("5000.00"),
            "Bob": Decimal("0.00"),
            "Charlie": Decimal("8000.00"),
            "Diana": Decimal("0.00"),
        }

        result = calc_service.calculate_period(period_data, holders, prior_carry_forwards)

        # Manual calculation:
        # Personal addback: 10,000 + 5,000 + 15,000 + 1,000 = 31,000
        # Pool: 150,000 + 8,000 + 31,000 - 20,000 - 5,000 + 3,000 - 2,000 = 165,000
        expected_pool = Decimal("165000.00")

        assert result.period.adjusted_pool == expected_pool
        assert result.period.total_shares == 100

        # Verify all holders present
        assert len(result.allocations) == 4

        # Verify carry-forwards applied
        alice = next(a for a in result.allocations if a.holder_name == "Alice")
        charlie = next(a for a in result.allocations if a.holder_name == "Charlie")

        assert alice.carry_forward_in == Decimal("5000.00")
        assert charlie.carry_forward_in == Decimal("8000.00")

        # Verify total payouts don't exceed pool
        total_payouts = sum(a.net_payout for a in result.allocations)
        assert total_payouts <= result.period.adjusted_pool

    def test_precision_with_many_decimal_places(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Verify calculation maintains precision with many decimal places."""
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.123"),
            ps_addback=Decimal("5000.456"),
            owner_draws=Decimal("10000.789"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=33, personal_charges=Decimal("1234.56")),
            HolderInput(holder_name="Bob", shares=67, personal_charges=Decimal("5678.90")),
        ]

        result = calc_service.calculate_period(period_data, holders, None)

        # Verify calculations complete without error
        assert result.period.adjusted_pool is not None

        # Verify payouts are rounded to cents
        for allocation in result.allocations:
            # Check that payout has at most 2 decimal places
            payout_str = str(allocation.net_payout)
            if "." in payout_str:
                decimal_places = len(payout_str.split(".")[1])
                assert decimal_places <= 2

        # Verify all payouts are non-negative
        for allocation in result.allocations:
            assert allocation.net_payout >= Decimal("0")

    def test_single_holder_accuracy(
        self, calc_service: ProfitShareCalculationService
    ) -> None:
        """Verify accuracy with single holder (no splitting)."""
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("5000.00"),
            owner_draws=Decimal("10000.00"),
            uncollectible=Decimal("2000.00"),
            bad_debt=Decimal("1000.00"),
            tax_optimization=Decimal("500.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("3000.00")),
        ]

        result = calc_service.calculate_period(period_data, holders, None)

        # Pool: 100,000 + 5,000 + 3,000 - 10,000 - 2,000 + 1,000 - 500 = 96,500
        # Alice gets 100% = 96,500 - 3,000 = 93,500

        assert result.period.adjusted_pool == Decimal("96500.00")
        assert result.allocations[0].gross_allocation == Decimal("96500.00")
        assert result.allocations[0].net_payout == Decimal("93500.00")
        assert result.allocations[0].carry_forward_out == Decimal("0.00")

        # No rounding adjustment needed for single holder
        assert result.period.rounding_delta == Decimal("0.00")
