"""Dashboard and Financial Analytics API Endpoints."""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select, extract, case, desc, asc
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    MonthlyAnalyticsResponse,
    MonthlyTrendPoint,
    CategoryAnalyticsResponse,
    CategoryBreakdownItem,
    BudgetVsActualResponse,
    BudgetComparisonItem,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated financial summary for dashboard"
)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> DashboardSummaryResponse:
    """Compute overall lifetime income, expenses, net balance, and current month metrics directly via SQL."""
    today = date.today()

    # Lifetime aggregates
    summary_stmt = (
        select(
            func.coalesce(
                func.sum(case((Transaction.type == "income", Transaction.amount), else_=0.0)),
                0.0
            ).label("total_income"),
            func.coalesce(
                func.sum(case((Transaction.type == "expense", Transaction.amount), else_=0.0)),
                0.0
            ).label("total_expenses"),
            func.count(Transaction.id).label("total_transactions")
        )
        .where(Transaction.user_id == current_user.id)
    )
    summary_res = db.execute(summary_stmt).first()
    total_inc = float(summary_res[0] or 0.0)
    total_exp = float(summary_res[1] or 0.0)
    total_tx = int(summary_res[2] or 0)
    curr_balance = round(total_inc - total_exp, 2)

    # Current month aggregates
    month_stmt = (
        select(
            func.coalesce(
                func.sum(case((Transaction.type == "expense", Transaction.amount), else_=0.0)),
                0.0
            ).label("month_expense"),
            func.coalesce(
                func.sum(case((Transaction.type == "income", Transaction.amount), else_=0.0)),
                0.0
            ).label("month_income")
        )
        .where(
            Transaction.user_id == current_user.id,
            extract("month", Transaction.transaction_date) == today.month,
            extract("year", Transaction.transaction_date) == today.year
        )
    )
    month_res = db.execute(month_stmt).first()
    curr_month_exp = float(month_res[0] or 0.0) if month_res else 0.0
    curr_month_inc = float(month_res[1] or 0.0) if month_res else 0.0

    return DashboardSummaryResponse(
        total_income=round(total_inc, 2),
        total_expenses=round(total_exp, 2),
        current_balance=curr_balance,
        current_month_spending=round(curr_month_exp, 2),
        current_month_income=round(curr_month_inc, 2),
        total_transactions=total_tx
    )


@router.get(
    "/monthly",
    response_model=MonthlyAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get monthly income, expense, and net trend data"
)
def get_monthly_trends(
    months: int = Query(6, ge=1, le=24, description="Number of past months to include"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> MonthlyAnalyticsResponse:
    """Retrieve chronologically sorted monthly breakdown for trend charts."""
    today = date.today()
    
    # Calculate list of (year, month) pairs for the requested window
    periods = []
    y, m = today.year, today.month
    for _ in range(months):
        periods.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    periods.reverse()

    # Query transaction aggregates grouped by year and month
    trend_stmt = (
        select(
            extract("year", Transaction.transaction_date).label("yr"),
            extract("month", Transaction.transaction_date).label("mo"),
            Transaction.type,
            func.sum(Transaction.amount).label("amt")
        )
        .where(Transaction.user_id == current_user.id)
        .group_by("yr", "mo", Transaction.type)
    )
    results = db.execute(trend_stmt).all()

    # Map results by (int(yr), int(mo), type)
    data_map = {}
    for row in results:
        key = (int(row[0]), int(row[1]), str(row[2]))
        data_map[key] = float(row[3] or 0.0)

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    points = []
    for yr, mo in periods:
        inc = data_map.get((yr, mo, "income"), 0.0)
        exp = data_map.get((yr, mo, "expense"), 0.0)
        label = f"{month_names[mo - 1]} {yr}"
        points.append(
            MonthlyTrendPoint(
                month=mo,
                year=yr,
                label=label,
                income=round(inc, 2),
                expense=round(exp, 2),
                net=round(inc - exp, 2)
            )
        )

    return MonthlyAnalyticsResponse(trends=points)


@router.get(
    "/categories",
    response_model=CategoryAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get expense breakdown by category"
)
def get_category_analytics(
    month: Optional[int] = Query(None, ge=1, le=12, description="Target month"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Target year"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> CategoryAnalyticsResponse:
    """Retrieve expense categories, amounts, and relative percentages for charts."""
    today = date.today()
    target_month = month if month is not None else today.month
    target_year = year if year is not None else today.year

    filters = [
        Transaction.user_id == current_user.id,
        Transaction.type == "expense"
    ]
    if month is not None or year is not None:
        filters.append(extract("month", Transaction.transaction_date) == target_month)
        filters.append(extract("year", Transaction.transaction_date) == target_year)

    cat_stmt = (
        select(
            Transaction.category,
            func.sum(Transaction.amount).label("total")
        )
        .where(*filters)
        .group_by(Transaction.category)
        .order_by(desc("total"))
    )
    rows = db.execute(cat_stmt).all()

    total_expense = sum(float(r[1] or 0.0) for r in rows)
    items = []
    for r in rows:
        amt = float(r[1] or 0.0)
        pct = round((amt / total_expense) * 100, 1) if total_expense > 0 else 0.0
        items.append(
            CategoryBreakdownItem(
                category=r[0],
                amount=round(amt, 2),
                percentage=pct
            )
        )

    return CategoryAnalyticsResponse(
        month=target_month,
        year=target_year,
        total_expense=round(total_expense, 2),
        categories=items
    )


@router.get(
    "/budget-vs-actual",
    response_model=BudgetVsActualResponse,
    status_code=status.HTTP_200_OK,
    summary="Get budget vs actual expense comparison for current or chosen month"
)
def get_budget_vs_actual(
    month: Optional[int] = Query(None, ge=1, le=12, description="Target month"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Target year"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> BudgetVsActualResponse:
    """Compare budgeted limits against actual spending in each category."""
    today = date.today()
    target_month = month if month is not None else today.month
    target_year = year if year is not None else today.year

    # 1. Fetch budgets for this period
    budgets_stmt = (
        select(Budget)
        .where(
            Budget.user_id == current_user.id,
            Budget.month == target_month,
            Budget.year == target_year
        )
        .order_by(Budget.category.asc())
    )
    budgets = db.scalars(budgets_stmt).all()

    # 2. Fetch expenses for this period
    expenses_stmt = (
        select(
            Transaction.category,
            func.sum(Transaction.amount).label("spent")
        )
        .where(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            extract("month", Transaction.transaction_date) == target_month,
            extract("year", Transaction.transaction_date) == target_year
        )
        .group_by(Transaction.category)
    )
    expenses_rows = db.execute(expenses_stmt).all()
    spent_map = {row[0]: float(row[1] or 0.0) for row in expenses_rows}

    # 3. Create union of all categories present in either budgets or expenses
    all_categories = set(b.category for b in budgets) | set(spent_map.keys())

    budget_map = {b.category: b.amount for b in budgets}
    items = []

    for cat in sorted(all_categories):
        b_amt = budget_map.get(cat, 0.0)
        a_amt = spent_map.get(cat, 0.0)
        diff = round(b_amt - a_amt, 2)
        pct = round((a_amt / b_amt) * 100, 1) if b_amt > 0 else (100.0 if a_amt > 0 else 0.0)
        is_exceeded = (a_amt > b_amt) and (b_amt > 0)

        items.append(
            BudgetComparisonItem(
                category=cat,
                budget=round(b_amt, 2),
                actual=round(a_amt, 2),
                difference=diff,
                percentage=pct,
                is_exceeded=is_exceeded
            )
        )

    return BudgetVsActualResponse(
        month=target_month,
        year=target_year,
        items=items
    )
