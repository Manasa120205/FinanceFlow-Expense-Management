"""Dashboard and Financial Analytics Pydantic Schemas."""
from typing import List
from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_income: float
    total_expenses: float
    current_balance: float
    current_month_spending: float
    current_month_income: float
    total_transactions: int


class MonthlyTrendPoint(BaseModel):
    month: int
    year: int
    label: str  # e.g., "Sep 2026"
    income: float
    expense: float
    net: float


class MonthlyAnalyticsResponse(BaseModel):
    trends: List[MonthlyTrendPoint]


class CategoryBreakdownItem(BaseModel):
    category: str
    amount: float
    percentage: float


class CategoryAnalyticsResponse(BaseModel):
    month: int
    year: int
    total_expense: float
    categories: List[CategoryBreakdownItem]


class BudgetComparisonItem(BaseModel):
    category: str
    budget: float
    actual: float
    difference: float
    percentage: float
    is_exceeded: bool


class BudgetVsActualResponse(BaseModel):
    month: int
    year: int
    items: List[BudgetComparisonItem]
