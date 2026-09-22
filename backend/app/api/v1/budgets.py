"""Monthly Budget System API Endpoints."""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, extract
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetProgressResponse,
    BudgetListResponse,
)

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get(
    "",
    response_model=BudgetListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get list of monthly budgets with real-time spending progress"
)
def get_budgets(
    month: Optional[int] = Query(None, ge=1, le=12, description="Target month (1 to 12)"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Target year"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BudgetListResponse:
    """List budgets for target month/year and compute actual spending, remaining amount, and usage %."""
    today = date.today()
    target_month = month if month is not None else today.month
    target_year = year if year is not None else today.year

    # 1. Fetch user's budgets for this period
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

    # 2. Fetch actual expenses grouped by category for this user and period
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
    expenses_result = db.execute(expenses_stmt).all()
    spent_map = {row[0]: float(row[1] or 0.0) for row in expenses_result}

    # 3. Assemble progress responses
    items = []
    total_budget = 0.0
    total_spent = 0.0

    for b in budgets:
        cat_spent = spent_map.get(b.category, 0.0)
        total_budget += b.amount
        total_spent += cat_spent

        pct = round((cat_spent / b.amount) * 100, 1) if b.amount > 0 else 0.0
        rem = round(max(0.0, b.amount - cat_spent), 2)
        is_warn = (pct >= 80.0 and pct <= 100.0)
        is_exceeded = (cat_spent > b.amount)

        items.append(
            BudgetProgressResponse(
                id=b.id,
                category=b.category,
                amount=round(b.amount, 2),
                actual_spent=round(cat_spent, 2),
                remaining=rem,
                percentage_used=pct,
                is_warning=is_warn,
                is_exceeded=is_exceeded,
                month=b.month,
                year=b.year,
            )
        )

    overall_pct = round((total_spent / total_budget) * 100, 1) if total_budget > 0 else 0.0

    return BudgetListResponse(
        items=items,
        month=target_month,
        year=target_year,
        total_budget=round(total_budget, 2),
        total_spent=round(total_spent, 2),
        overall_percentage=overall_pct
    )


@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a monthly budget for an expense category"
)
def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> BudgetResponse:
    """Create a new budget limit for a category in a specific month and year."""
    # Check if budget already exists for this category/month/year
    existing = db.scalars(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.category == payload.category,
            Budget.month == payload.month,
            Budget.year == payload.year
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A budget for '{payload.category}' in {payload.month}/{payload.year} already exists. Please update the existing budget instead."
        )

    budget = Budget(
        user_id=current_user.id,
        category=payload.category,
        amount=round(payload.amount, 2),
        month=payload.month,
        year=payload.year,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return BudgetResponse.model_validate(budget)


@router.put(
    "/{budget_id}",
    response_model=BudgetResponse,
    status_code=status.HTTP_200_OK,
    summary="Update budget amount"
)
def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> BudgetResponse:
    """Update the budgeted limit for an existing budget."""
    stmt = select(Budget).where(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    )
    budget = db.scalars(stmt).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found or you do not have permission to modify it."
        )

    if payload.amount is not None:
        budget.amount = round(payload.amount, 2)

    db.commit()
    db.refresh(budget)
    return BudgetResponse.model_validate(budget)


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a budget"
)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a budget ensuring user ownership."""
    stmt = select(Budget).where(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    )
    budget = db.scalars(stmt).first()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found or you do not have permission to delete it."
        )

    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully."}
