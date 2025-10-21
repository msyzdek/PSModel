"""SQLAlchemy model for Holder."""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .holder_allocation import HolderAllocation


class Holder(Base):
    """Model representing a holder in the profit share system."""

    __tablename__ = "holders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    default_shares: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationship to holder allocations
    allocations: Mapped[list["HolderAllocation"]] = relationship(
        "HolderAllocation", back_populates="holder"
    )

    def __repr__(self) -> str:
        """String representation of Holder."""
        return f"<Holder(id={self.id}, name={self.name}, is_active={self.is_active})>"
