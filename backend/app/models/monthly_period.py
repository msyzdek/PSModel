"""SQLAlchemy model for MonthlyPeriod."""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DECIMAL, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .holder_allocation import HolderAllocation


class MonthlyPeriod(Base):
    """Model representing a monthly profit share calculation period."""

    __tablename__ = "monthly_periods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    net_income_qb: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False)
    ps_addback: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    owner_draws: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    uncollectible: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    bad_debt: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    tax_optimization: Mapped[Decimal] = mapped_column(
        DECIMAL(12, 2), nullable=False, default=0
    )
    adjusted_pool: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False)
    total_shares: Mapped[int] = mapped_column(Integer, nullable=False)
    rounding_delta: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationship to holder allocations
    allocations: Mapped[list["HolderAllocation"]] = relationship(
        "HolderAllocation", back_populates="period", cascade="all, delete-orphan"
    )

    __table_args__ = (UniqueConstraint("year", "month", name="uq_year_month"),)

    def __repr__(self) -> str:
        """String representation of MonthlyPeriod."""
        return f"<MonthlyPeriod(id={self.id}, year={self.year}, month={self.month})>"
