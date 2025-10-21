"""End-to-end tests for complete user flows."""

from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.models.base import Base
from app.schemas.period import HolderInput, PeriodInput
from app.services.period_service import PeriodService


class TestEndToEndFlows:
    """Test complete user flows from creation to navigation."""

    @pytest.fixture
    def db_session(self) -> Session:
        """Create a test database session."""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        yield session
        session.close()

    @pytest.fixture
    def period_service(self, db_session: Session) -> PeriodService:
        """Create period service instance."""
        return PeriodService(db_session)

    def test_create_first_period_no_carry_forward(
        self, period_service: PeriodService
    ) -> None:
        """Test creating the first period with no prior carry-forwards."""
        # User enters first period data
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("5000.00"),
            owner_draws=Decimal("10000.00"),
            uncollectible=Decimal("0.00"),
            bad_debt=Decimal("0.00"),
            tax_optimization=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=60, personal_charges=Decimal("2000.00")),
            HolderInput(holder_name="Bob", shares=40, personal_charges=Decimal("1000.00")),
        ]

        # Create period
        period = period_service.create_period(period_data, holders)

        # Verify period was created
        assert period.id is not None
        assert period.year == 2024
        assert period.month == 1

        # Verify calculations were performed
        assert period.adjusted_pool > Decimal("0")
        assert period.total_shares == 100

        # Verify allocations were created
        assert len(period.allocations) == 2

        # Verify no carry-forwards applied (first period)
        for allocation in period.allocations:
            assert allocation.carry_forward_in == Decimal("0")

        # Verify period can be retrieved
        retrieved = period_service.get_period(2024, 1)
        assert retrieved is not None
        assert retrieved.id == period.id
        assert len(retrieved.allocations) == 2

    def test_create_second_period_with_carry_forward(
        self, period_service: PeriodService
    ) -> None:
        """Test creating a second period that applies carry-forwards from the first."""
        # Create first period with high personal charges to generate carry-forward
        period1_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("50000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders1 = [
            HolderInput(holder_name="Alice", shares=50, personal_charges=Decimal("40000.00")),
            HolderInput(holder_name="Bob", shares=50, personal_charges=Decimal("5000.00")),
        ]

        period1 = period_service.create_period(period1_data, holders1)

        # Verify Alice has carry-forward
        alice1 = next(a for a in period1.allocations if a.holder_name == "Alice")
        assert alice1.net_payout == Decimal("0.00")
        assert alice1.carry_forward_out > Decimal("0")
        alice_carry_forward = alice1.carry_forward_out

        # Create second period
        period2_data = PeriodInput(
            year=2024,
            month=2,
            net_income_qb=Decimal("80000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders2 = [
            HolderInput(holder_name="Alice", shares=50, personal_charges=Decimal("5000.00")),
            HolderInput(holder_name="Bob", shares=50, personal_charges=Decimal("5000.00")),
        ]

        period2 = period_service.create_period(period2_data, holders2)

        # Verify carry-forward was applied to Alice
        alice2 = next(a for a in period2.allocations if a.holder_name == "Alice")
        assert alice2.carry_forward_in == alice_carry_forward

        # Verify Alice's payout is reduced by carry-forward
        assert alice2.net_payout < alice2.gross_allocation

        # Verify Bob has no carry-forward
        bob2 = next(a for a in period2.allocations if a.holder_name == "Bob")
        assert bob2.carry_forward_in == Decimal("0")

    def test_update_existing_period(self, period_service: PeriodService) -> None:
        """Test updating an existing period and recalculating."""
        # Create initial period
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("5000.00"),
            owner_draws=Decimal("10000.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=60, personal_charges=Decimal("1000.00")),
        ]

        period = period_service.create_period(period_data, holders)
        original_id = period.id
        original_pool = period.adjusted_pool

        # Update the period with new data
        updated_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("120000.00"),  # Changed
            ps_addback=Decimal("6000.00"),  # Changed
            owner_draws=Decimal("12000.00"),  # Changed
        )

        updated_holders = [
            HolderInput(holder_name="Alice", shares=60, personal_charges=Decimal("1500.00")),
            HolderInput(holder_name="Bob", shares=40, personal_charges=Decimal("500.00")),  # Added
        ]

        updated_period = period_service.update_period(2024, 1, updated_data, updated_holders)

        # Verify same period was updated
        assert updated_period.id == original_id

        # Verify data was updated
        assert updated_period.net_income_qb == Decimal("120000.00")
        assert updated_period.adjusted_pool != original_pool

        # Verify new holder was added
        assert len(updated_period.allocations) == 2

        # Verify calculations were redone
        assert updated_period.total_shares == 100

    def test_navigation_between_periods(self, period_service: PeriodService) -> None:
        """Test navigating between different periods."""
        # Create multiple periods
        holders = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("0.00")),
        ]

        # Create Jan, Feb, Mar 2024
        for month in [1, 2, 3]:
            period_data = PeriodInput(
                year=2024,
                month=month,
                net_income_qb=Decimal("50000.00"),
                ps_addback=Decimal("0.00"),
                owner_draws=Decimal("0.00"),
            )
            period_service.create_period(period_data, holders)

        # Test listing all periods
        all_periods = period_service.list_periods()
        assert len(all_periods) == 3

        # Verify periods are ordered by most recent first
        assert all_periods[0].month == 3
        assert all_periods[1].month == 2
        assert all_periods[2].month == 1

        # Test getting specific period
        jan_period = period_service.get_period(2024, 1)
        assert jan_period is not None
        assert jan_period.month == 1

        # Test getting prior period
        prior_to_feb = period_service.get_prior_period(2024, 2)
        assert prior_to_feb is not None
        assert prior_to_feb.month == 1

        prior_to_mar = period_service.get_prior_period(2024, 3)
        assert prior_to_mar is not None
        assert prior_to_mar.month == 2

        # Test no prior period for first month
        prior_to_jan = period_service.get_prior_period(2024, 1)
        assert prior_to_jan is None

    def test_delete_period(self, period_service: PeriodService) -> None:
        """Test deleting a period."""
        # Create period
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("0.00")),
        ]

        period = period_service.create_period(period_data, holders)
        period_id = period.id

        # Verify period exists
        retrieved = period_service.get_period(2024, 1)
        assert retrieved is not None

        # Delete period
        period_service.delete_period(2024, 1)

        # Verify period no longer exists
        deleted = period_service.get_period(2024, 1)
        assert deleted is None

    def test_error_duplicate_period(self, period_service: PeriodService) -> None:
        """Test error handling when creating duplicate period."""
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("0.00")),
        ]

        # Create first period
        period_service.create_period(period_data, holders)

        # Attempt to create duplicate should raise error
        with pytest.raises(Exception):  # SQLAlchemy will raise IntegrityError
            period_service.create_period(period_data, holders)

    def test_error_invalid_period_data(self, period_service: PeriodService) -> None:
        """Test error handling with invalid period data."""
        # Test with positive pool but zero shares
        period_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=0, personal_charges=Decimal("0.00")),
        ]

        # Should raise validation error
        with pytest.raises(ValueError, match="Total shares must be greater than 0"):
            period_service.create_period(period_data, holders)

    def test_error_nonexistent_period(self, period_service: PeriodService) -> None:
        """Test error handling when accessing nonexistent period."""
        # Try to get period that doesn't exist
        period = period_service.get_period(2024, 12)
        assert period is None

        # Try to update period that doesn't exist
        period_data = PeriodInput(
            year=2024,
            month=12,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("0.00")),
        ]

        with pytest.raises(ValueError, match="Period not found"):
            period_service.update_period(2024, 12, period_data, holders)

    def test_multi_period_carry_forward_chain(
        self, period_service: PeriodService
    ) -> None:
        """Test carry-forward propagation across multiple periods."""
        # Create period 1 with deficit
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

        period1 = period_service.create_period(period1_data, holders1)
        alice1 = period1.allocations[0]
        assert alice1.carry_forward_out > Decimal("0")
        carry1 = alice1.carry_forward_out

        # Create period 2 - still has deficit
        period2_data = PeriodInput(
            year=2024,
            month=2,
            net_income_qb=Decimal("15000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders2 = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("20000.00")),
        ]

        period2 = period_service.create_period(period2_data, holders2)
        alice2 = period2.allocations[0]
        assert alice2.carry_forward_in == carry1
        assert alice2.carry_forward_out > Decimal("0")
        carry2 = alice2.carry_forward_out

        # Verify carry-forward accumulated
        assert carry2 > carry1

        # Create period 3 - finally profitable enough
        period3_data = PeriodInput(
            year=2024,
            month=3,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders3 = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("5000.00")),
        ]

        period3 = period_service.create_period(period3_data, holders3)
        alice3 = period3.allocations[0]
        assert alice3.carry_forward_in == carry2
        assert alice3.net_payout > Decimal("0")
        assert alice3.carry_forward_out == Decimal("0")

    def test_year_boundary_navigation(self, period_service: PeriodService) -> None:
        """Test navigation across year boundary."""
        holders = [
            HolderInput(holder_name="Alice", shares=100, personal_charges=Decimal("0.00")),
        ]

        # Create December 2023
        dec_data = PeriodInput(
            year=2023,
            month=12,
            net_income_qb=Decimal("50000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )
        period_service.create_period(dec_data, holders)

        # Create January 2024
        jan_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("60000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )
        period_service.create_period(jan_data, holders)

        # Test getting prior period across year boundary
        prior = period_service.get_prior_period(2024, 1)
        assert prior is not None
        assert prior.year == 2023
        assert prior.month == 12

        # Test listing includes both years
        all_periods = period_service.list_periods()
        assert len(all_periods) == 2
        assert all_periods[0].year == 2024
        assert all_periods[1].year == 2023

    def test_holder_changes_between_periods(
        self, period_service: PeriodService
    ) -> None:
        """Test handling holder changes between periods."""
        # Period 1 with two holders
        period1_data = PeriodInput(
            year=2024,
            month=1,
            net_income_qb=Decimal("100000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders1 = [
            HolderInput(holder_name="Alice", shares=50, personal_charges=Decimal("5000.00")),
            HolderInput(holder_name="Bob", shares=50, personal_charges=Decimal("3000.00")),
        ]

        period1 = period_service.create_period(period1_data, holders1)
        assert len(period1.allocations) == 2

        # Period 2 with three holders (Charlie added)
        period2_data = PeriodInput(
            year=2024,
            month=2,
            net_income_qb=Decimal("120000.00"),
            ps_addback=Decimal("0.00"),
            owner_draws=Decimal("0.00"),
        )

        holders2 = [
            HolderInput(holder_name="Alice", shares=40, personal_charges=Decimal("4000.00")),
            HolderInput(holder_name="Bob", shares=40, personal_charges=Decimal("3000.00")),
            HolderInput(holder_name="Charlie", shares=20, personal_charges=Decimal("2000.00")),
        ]

        period2 = period_service.create_period(period2_data, holders2)
        assert len(period2.allocations) == 3

        # Verify Charlie has no carry-forward (new holder)
        charlie = next(a for a in period2.allocations if a.holder_name == "Charlie")
        assert charlie.carry_forward_in == Decimal("0")

        # Verify Alice and Bob have carry-forwards if applicable
        alice2 = next(a for a in period2.allocations if a.holder_name == "Alice")
        bob2 = next(a for a in period2.allocations if a.holder_name == "Bob")

        # They should have carry-forwards from period 1
        alice1 = next(a for a in period1.allocations if a.holder_name == "Alice")
        bob1 = next(a for a in period1.allocations if a.holder_name == "Bob")

        assert alice2.carry_forward_in == alice1.carry_forward_out
        assert bob2.carry_forward_in == bob1.carry_forward_out
