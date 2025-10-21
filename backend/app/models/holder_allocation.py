"""SQLAlchemy model for HolderAllocation."""

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DECIMAL, Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .monthly_period import MonthlyPeriod


class HolderAllocation(Base):
    """Model representing a profit share allocation for a specific holder in a period."""

    __tablename__ = "holder_allocations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    period_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("monthly_periods.id", ondelete="CASCADE"), nullable=False
    )
    holder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    shares: Mapped[int] = mapped_column(Integer, nullable=False)
    personal_charges: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    carry_forward_in: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    gross_allocation: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False)
    net_payout: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False)
    carry_forward_out: Mapped[Decimal] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    received_rounding_adjustment: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationship to monthly period
    period: Mapped["MonthlyPeriod"] = relationship("MonthlyPeriod", back_populates="allocations")

    def __repr__(self) -> str:
        """String representation of HolderAllocation."""
        return (
            f"<HolderAllocation(id={self.id}, period_id={self.period_id}, "
            f"holder_name={self.holder_name})>"
        )
