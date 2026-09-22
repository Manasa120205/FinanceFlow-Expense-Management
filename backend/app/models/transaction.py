"""Transaction Database Model."""
from datetime import date
from sqlalchemy import String, Float, Date, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # "income" or "expense"
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="transactions")

    __table_args__ = (
        Index("ix_transactions_user_date", "user_id", "transaction_date"),
        Index("ix_transactions_user_type", "user_id", "type"),
        Index("ix_transactions_user_category", "user_id", "category"),
    )

    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, user_id={self.user_id}, type='{self.type}', amount={self.amount})>"
