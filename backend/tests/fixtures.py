"""Test data fixtures for profit share calculator testing."""

from decimal import Decimal
from typing import Any

from app.schemas.period import HolderInput, PeriodInput


class TestFixtures:
    """Collection of test data fixtures for various scenarios."""

    @staticmethod
    def basic_period() -> dict[str, Any]:
        """
        Basic period with positive pool and simple allocations.

        Expected results:
        - Adjusted pool: 100,000 + 5,000 + 1,500 - 10,000 = 96,500
        - Total shares: 100
        - Holder A (60 shares): 57,900 - 1,000 = 56,900
        - Holder B (40 shares): 38,600 - 500 = 38,100
        """
        return {
            "period": PeriodInput(
                year=2024,
                month=1,
                net_income_qb=Decimal("100000.00"),
                ps_addback=Decimal("5000.00"),
                owner_draws=Decimal("10000.00"),
                uncollectible=Decimal("0.00"),
                bad_debt=Decimal("0.00"),
                tax_optimization=Decimal("0.00"),
            ),
            "holders": [
                HolderInput(
                    holder_name="Holder A", shares=60, personal_charges=Decimal("1000.00")
                ),
                HolderInput(
                    holder_name="Holder B", shares=40, personal_charges=Decimal("500.00")
                ),
            ],
            "expected": {
                "adjusted_pool": Decimal("96500.00"),
                "total_shares": 100,
                "allocations": {
                    "Holder A": {
                        "gross": Decimal("57900.00"),
                        "net_payout": Decimal("56900.00"),
                        "carry_forward_out": Decimal("0.00"),
                    },
                    "Holder B": {
                        "gross": Decimal("38600.00"),
                        "net_payout": Decimal("38100.00"),
                        "carry_forward_out": Decimal("0.00"),
                    },
                },
            },
        }

    @staticmethod
    def negative_pool() -> dict[str, Any]:
        """
        Period with negative adjusted pool (loss).

        Expected results:
        - Adjusted pool: 10,000 + 0 + 0 - 50,000 = -40,000
        - All holders get 0 payout
        - Carry-forwards generated based on negative allocations
        """
        return {
            "period": PeriodInput(
                year=2024,
                month=1,
                net_income_qb=Decimal("10000.00"),
                ps_addback=Decimal("0.00"),
                owner_draws=Decimal("50000.00"),
                uncollectible=Decimal("0.00"),
                bad_debt=Decimal("0.00"),
                tax_optimization=Decimal("0.00"),
            ),
            "holders": [
                HolderInput(holder_name="Holder A", shares=50, personal_charges=Decimal("0.00")),
                HolderInput(holder_name="Holder B", shares=50, personal_charges=Decimal("0.00")),
            ],
            "expected": {
                "adjusted_pool": Decimal("-40000.00"),
                "total_shares": 100,
                "allocations": {
                    "Holder A": {
                        "gross": Decimal("-20000.00"),
                        "net_payout": Decimal("0.00"),
                        "carry_forward_out": Decimal("20000.00"),
                    },
                    "Holder B": {
                        "gross": Decimal("-20000.00"),
                        "net_payout": Decimal("0.00"),
                        "carry_forward_out": Decimal("20000.00"),
                    },
                },
            },
        }

    @staticmethod
    def zero_shares() -> dict[str, Any]:
        """
        Period with zero total shares (edge case).

        Expected results:
        - Should handle gracefully with zero allocations
        """
        return {
            "period": PeriodInput(
                year=2024,
                month=1,
                net_income_qb=Decimal("100000.00"),
                ps_addback=Decimal("0.00"),
                owner_draws=Decimal("0.00"),
                uncollectible=Decimal("0.00"),
                bad_debt=Decimal("0.00"),
                tax_optimization=Decimal("0.00"),
            ),
            "holders": [
                HolderInput(holder_name="Holder A", shares=0, personal_charges=Decimal("0.00")),
            ],
            "expected": {
                "adjusted_pool": Decimal("100000.00"),
                "total_shares": 0,
                "should_raise": ValueError,  # Should raise error for positive pool with zero shares
            },
        }

    @staticmethod
    def high_personal_charges() -> dict[str, Any]:
        """
        Period where personal charges exceed gross allocation.

        Expected results:
        - Holder A: 30,000 gross - 40,000 charges = -10,000 -> 0 payout, 10,000 carry-forward
        - Holder B: 20,000 gross - 5,000 charges = 15,000 payout
        """
        return {
            "period": PeriodInput(
                year=2024,
                month=1,
                net_income_qb=Decimal("50000.00"),
                ps_addback=Decimal("0.00"),
                owner_draws=Decimal("0.00"),
                uncollectible=Decimal("0.00"),
                bad_debt=Decimal("0.00"),
                tax_optimization=Decimal("0.00"),
            ),
            "holders": [
                HolderInput(
                    holder_name="Holder A", shares=60, personal_charges=Decimal("40000.00")
                ),
                HolderInput(
                    holder_name="Holder B", shares=40, personal_charges=Decimal("5000.00")
                ),
            ],
            "expected": {
                "adjusted_pool": Decimal("95000.00"),  # 50,000 + 45,000 personal addback
                "total_shares": 100,
                "allocations": {
                    "Holder A": {
                        "gross": Decimal("57000.00"),
                        "net_payout": Decimal("0.00"),
                        "carry_forward_out": Decimal("23000.00"),  # 40,000 - 57,000 = -17,000
                    },
                    "Holder B": {
                        "gross": Decimal("38000.00"),
                        "net_payout": Decimal("33000.00"),
                        "carry_forward_out": Decimal("0.00"),
                    },
                },
            },
        }

    @staticmethod
    def carry_forward_scenario() -> tuple[dict[str, Any], dict[str, Any]]:
        """
        Two-period scenario demonstrating carry-forward propagation.

        Period 1: Generate carry-forwards
        Period 2: Apply carry-forwards from period 1
        """
        period1 = {
            "period": PeriodInput(
                year=2024,
                month=1,
                net_income_qb=Decimal("20000.00"),
                ps_addback=Decimal("0.00"),
                owner_draws=Decimal("0.00"),
                uncollectible=Decimal("0.00"),
                bad_debt=Decimal("0.00"),
                tax_optimization=Decimal("0.00"),
            ),
            "holders": [
                HolderInput(
                    holder_name="Alice", shares=50, personal_charges=Decimal("15000.00")
                ),
                HolderInput(holder_name="Bob", shares=50, personal_charges=Decimal("2000.00")),
            ],
            "expected": {
                "adjusted_pool": Decimal("37000.00"),  # 20,000 + 17,000 personal addback
                "allocations": {
                    "Alice": {
                        "gross": Decimal("18500.00"),
                        "net_payout": Decimal("0.00"),
                        "carry_forward_out": Decimal("11500.00"),  # 15,000 - 18,500 = -3,500
                    },
                    "Bob": {
                        "gross": Decimal("18500.00"),
                        "net_payout": Decimal("16500.00"),
                        "carry_forward_out": Decimal("0.00"),
                    },
                },
            },
        }

        period2 = {
            "period": PeriodInput(
                year=2024,
                month=2,
                net_income_qb=Decimal("50000.00"),
                ps_addback=Decimal("0.00"),
                owner_draws=Decimal("0.00"),
                uncollectible=Decimal("0.00"),
                bad_debt=Decimal("0.00"),
                tax_optimization=Decimal("0.00"),
            ),
            "holders": [
                HolderInput(holder_name="Alice", shares=50, personal_charges=Decimal("5000.00")),
                HolderInput(holder_name="Bob", shares=50, personal_charges=Decimal("3000.00")),
            ],
            "prior_carry_forwards": {
                "Alice": Decimal("11500.00"),
                "Bob": Decimal("0.00"),
            },
            "expected": {
                "adjusted_pool": Decimal("58000.00"),  # 50,000 + 8,000 personal addback
                "allocations": {
                    "Alice": {
                        "gross": Decimal("29000.00"),
                        "carry_forward_in": Decimal("11500.00"),
                        "net_payout": Decimal("12500.00"),  # 29,000 - 5,000 - 11,500
                        "carry_forward_out": Decimal("0.00"),
                    },
                    "Bob": {
                        "gross": Decimal("29000.00"),
                        "carry_forward_in": Decimal("0.00"),
                        "net_payout": Decimal("26000.00"),
                        "carry_forward_out": Decimal("0.00"),
                    },
                },
            },
        }

        return period1, period2

    @staticmethod
    def rounding_edge_case() -> dict[str, Any]:
        """
        Period designed to test rounding reconciliation.

        Uses values that create rounding differences.
        """
        return {
            "period": PeriodInput(
                year=2024,
                month=1,
                net_income_qb=Decimal("100000.33"),
                ps_addback=Decimal("0.00"),
                owner_draws=Decimal("0.00"),
                uncollectible=Decimal("0.00"),
                bad_debt=Decimal("0.00"),
                tax_optimization=Decimal("0.00"),
            ),
            "holders": [
                HolderInput(holder_name="Holder A", shares=33, personal_charges=Decimal("0.00")),
                HolderInput(holder_name="Holder B", shares=33, personal_charges=Decimal("0.00")),
                HolderInput(holder_name="Holder C", shares=34, personal_charges=Decimal("0.00")),
            ],
            "expected": {
                "adjusted_pool": Decimal("100000.33"),
                "total_shares": 100,
                # Rounding will create small differences that need reconciliation
                "has_rounding_delta": True,
            },
        }

    @staticmethod
    def special_adjustments() -> dict[str, Any]:
        """
        Period with all special adjustment types.

        Tests uncollectible income, bad debt, and tax optimization.
        """
        return {
            "period": PeriodInput(
                year=2024,
                month=1,
                net_income_qb=Decimal("100000.00"),
                ps_addback=Decimal("5000.00"),
                owner_draws=Decimal("10000.00"),
                uncollectible=Decimal("3000.00"),
                bad_debt=Decimal("2000.00"),
                tax_optimization=Decimal("1000.00"),
            ),
            "holders": [
                HolderInput(holder_name="Holder A", shares=100, personal_charges=Decimal("0.00")),
            ],
            "expected": {
                # 100,000 + 5,000 + 0 - 10,000 - 3,000 + 2,000 - 1,000 = 93,000
                "adjusted_pool": Decimal("93000.00"),
                "total_shares": 100,
                "allocations": {
                    "Holder A": {
                        "gross": Decimal("93000.00"),
                        "net_payout": Decimal("93000.00"),
                        "carry_forward_out": Decimal("0.00"),
                    },
                },
            },
        }

    @staticmethod
    def multiple_holders_complex() -> dict[str, Any]:
        """
        Complex scenario with multiple holders, various charges, and carry-forwards.
        """
        return {
            "period": PeriodInput(
                year=2024,
                month=3,
                net_income_qb=Decimal("150000.00"),
                ps_addback=Decimal("8000.00"),
                owner_draws=Decimal("20000.00"),
                uncollectible=Decimal("5000.00"),
                bad_debt=Decimal("3000.00"),
                tax_optimization=Decimal("2000.00"),
            ),
            "holders": [
                HolderInput(
                    holder_name="Alice", shares=40, personal_charges=Decimal("10000.00")
                ),
                HolderInput(holder_name="Bob", shares=30, personal_charges=Decimal("5000.00")),
                HolderInput(
                    holder_name="Charlie", shares=20, personal_charges=Decimal("15000.00")
                ),
                HolderInput(holder_name="Diana", shares=10, personal_charges=Decimal("1000.00")),
            ],
            "prior_carry_forwards": {
                "Alice": Decimal("5000.00"),
                "Bob": Decimal("0.00"),
                "Charlie": Decimal("8000.00"),
                "Diana": Decimal("0.00"),
            },
            "expected": {
                # 150,000 + 8,000 + 31,000 - 20,000 - 5,000 + 3,000 - 2,000 = 165,000
                "adjusted_pool": Decimal("165000.00"),
                "total_shares": 100,
            },
        }

    @staticmethod
    def year_boundary_carry_forward() -> tuple[dict[str, Any], dict[str, Any]]:
        """
        Test carry-forward across year boundary (Dec to Jan).
        """
        period_dec = {
            "period": PeriodInput(
                year=2023,
                month=12,
                net_income_qb=Decimal("30000.00"),
                ps_addback=Decimal("0.00"),
                owner_draws=Decimal("0.00"),
                uncollectible=Decimal("0.00"),
                bad_debt=Decimal("0.00"),
                tax_optimization=Decimal("0.00"),
            ),
            "holders": [
                HolderInput(
                    holder_name="Holder A", shares=100, personal_charges=Decimal("40000.00")
                ),
            ],
            "expected": {
                "adjusted_pool": Decimal("70000.00"),
                "allocations": {
                    "Holder A": {
                        "gross": Decimal("70000.00"),
                        "net_payout": Decimal("0.00"),
                        "carry_forward_out": Decimal("10000.00"),
                    },
                },
            },
        }

        period_jan = {
            "period": PeriodInput(
                year=2024,
                month=1,
                net_income_qb=Decimal("50000.00"),
                ps_addback=Decimal("0.00"),
                owner_draws=Decimal("0.00"),
                uncollectible=Decimal("0.00"),
                bad_debt=Decimal("0.00"),
                tax_optimization=Decimal("0.00"),
            ),
            "holders": [
                HolderInput(holder_name="Holder A", shares=100, personal_charges=Decimal("0.00")),
            ],
            "prior_carry_forwards": {
                "Holder A": Decimal("10000.00"),
            },
            "expected": {
                "adjusted_pool": Decimal("50000.00"),
                "allocations": {
                    "Holder A": {
                        "gross": Decimal("50000.00"),
                        "carry_forward_in": Decimal("10000.00"),
                        "net_payout": Decimal("40000.00"),
                        "carry_forward_out": Decimal("0.00"),
                    },
                },
            },
        }

        return period_dec, period_jan
