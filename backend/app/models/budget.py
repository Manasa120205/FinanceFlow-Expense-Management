"""Budget Database Model."""
from sqlalchemy import String, Float, Integer, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Budget(Base, TimestampMixin):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 12
    year: Mapped[int] = mapped_column(Integer, nullable=False)   # e.g., 2026

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="budgets")

    __table_args__ = (
        UniqueConstraint(
            "user_id", "category", "month", "year",
            name="uq_user_category_month_year"
        ),
        Index("ix_budgets_user_period", "user_id", "year", "month"),
    )

    def __repr__(self) -> str:
        return f"<Budget(id={self.id}, user_id={self.user_id}, category='{self.category}', amount={self.amount}, period={self.month}/{self.year})>"
