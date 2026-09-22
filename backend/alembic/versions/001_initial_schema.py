"""Initial schema for users, transactions, and budgets

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 2. Transactions table
    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transactions_id", "transactions", ["id"], unique=False)
    op.create_index("ix_transactions_user_id", "transactions", ["user_id"], unique=False)
    op.create_index("ix_transactions_type", "transactions", ["type"], unique=False)
    op.create_index("ix_transactions_category", "transactions", ["category"], unique=False)
    op.create_index("ix_transactions_transaction_date", "transactions", ["transaction_date"], unique=False)
    op.create_index("ix_transactions_user_date", "transactions", ["user_id", "transaction_date"], unique=False)
    op.create_index("ix_transactions_user_type", "transactions", ["user_id", "type"], unique=False)
    op.create_index("ix_transactions_user_category", "transactions", ["user_id", "category"], unique=False)

    # 3. Budgets table
    op.create_table(
        "budgets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "category", "month", "year", name="uq_user_category_month_year")
    )
    op.create_index("ix_budgets_id", "budgets", ["id"], unique=False)
    op.create_index("ix_budgets_user_id", "budgets", ["user_id"], unique=False)
    op.create_index("ix_budgets_user_period", "budgets", ["user_id", "year", "month"], unique=False)


def downgrade() -> None:
    op.drop_table("budgets")
    op.drop_table("transactions")
    op.drop_table("users")
