"""Repository for MonthlyPeriod data access operations."""

from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.models.monthly_period import MonthlyPeriod


class PeriodRepository:
    """Repository for managing MonthlyPeriod persistence."""

    def __init__(self, db: Session) -> None:
        """
        Initialize repository with database session.

        Args:
            db: SQLAlchemy database session

        """
        self.db = db

    def save(self, period: MonthlyPeriod) -> MonthlyPeriod:
        """
        Save a MonthlyPeriod to the database.

        Args:
            period: MonthlyPeriod instance to save

        Returns:
            MonthlyPeriod: Saved period with updated id

        """
        self.db.add(period)
        self.db.commit()
        self.db.refresh(period)
        return period

    def find_by_id(self, period_id: int) -> Optional[MonthlyPeriod]:
        """
        Find a MonthlyPeriod by its ID.

        Args:
            period_id: ID of the period to find

        Returns:
            Optional[MonthlyPeriod]: Period if found, None otherwise

        """
        return (
            self.db.query(MonthlyPeriod)
            .options(joinedload(MonthlyPeriod.allocations))
            .filter(MonthlyPeriod.id == period_id)
            .first()
        )

    def find_by_year_month(self, year: int, month: int) -> Optional[MonthlyPeriod]:
        """
        Find a MonthlyPeriod by year and month.

        Args:
            year: Year of the period
            month: Month of the period (1-12)

        Returns:
            Optional[MonthlyPeriod]: Period if found, None otherwise

        """
        return (
            self.db.query(MonthlyPeriod)
            .options(joinedload(MonthlyPeriod.allocations))
            .filter(MonthlyPeriod.year == year, MonthlyPeriod.month == month)
            .first()
        )

    def find_all(self, limit: int = 100) -> list[MonthlyPeriod]:
        """
        Find all MonthlyPeriods ordered by year and month descending.

        Args:
            limit: Maximum number of periods to return (default: 100)

        Returns:
            list[MonthlyPeriod]: List of periods ordered by most recent first

        """
        return (
            self.db.query(MonthlyPeriod)
            .order_by(desc(MonthlyPeriod.year), desc(MonthlyPeriod.month))
            .limit(limit)
            .all()
        )

    def delete(self, period_id: int) -> None:
        """
        Delete a MonthlyPeriod by its ID.

        Args:
            period_id: ID of the period to delete

        """
        period = self.db.query(MonthlyPeriod).filter(MonthlyPeriod.id == period_id).first()
        if period:
            self.db.delete(period)
            self.db.commit()
