"""Budget Request and Response Pydantic Schemas."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class BudgetBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=50, description="Expense category for this budget")
    amount: float = Field(..., gt=0, description="Monthly budget limit, must be greater than 0")
    month: int = Field(..., ge=1, le=12, description="Calendar month (1 to 12)")
    year: int = Field(..., ge=2000, le=2100, description="Calendar year (e.g. 2026)")

    @field_validator("category")
    @classmethod
    def clean_category(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Category cannot be empty or blank.")
        return clean


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0, description="New budget limit")


class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetProgressResponse(BaseModel):
    id: int
    category: str
    amount: float            # Budgeted amount
    actual_spent: float      # Sum of expenses in this category for this month
    remaining: float         # max(0, amount - actual_spent)
    percentage_used: float   # (actual_spent / amount) * 100, rounded to 1 decimal
    is_warning: bool         # True if percentage_used >= 80% and <= 100%
    is_exceeded: bool        # True if actual_spent > amount
    month: int
    year: int

    model_config = ConfigDict(from_attributes=True)


class BudgetListResponse(BaseModel):
    items: List[BudgetProgressResponse]
    month: int
    year: int
    total_budget: float
    total_spent: float
    overall_percentage: float
