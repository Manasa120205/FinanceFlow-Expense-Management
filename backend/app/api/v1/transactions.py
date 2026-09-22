"""Transaction Management API Endpoints."""
from datetime import date
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, desc, asc, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get(
    "",
    response_model=TransactionListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get paginated list of transactions with search and filters"
)
def get_transactions(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    type: Optional[str] = Query(None, description="Filter by type: income or expense"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[date] = Query(None, description="Start date filter (inclusive)"),
    end_date: Optional[date] = Query(None, description="End date filter (inclusive)"),
    min_amount: Optional[float] = Query(None, ge=0, description="Minimum amount filter"),
    max_amount: Optional[float] = Query(None, ge=0, description="Maximum amount filter"),
    search: Optional[str] = Query(None, description="Search keyword matching description or category"),
    sort_by: str = Query("transaction_date", description="Field to sort by (transaction_date, amount, created_at)"),
    sort_order: str = Query("desc", description="Sort direction (asc or desc)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionListResponse:
    """Retrieve user transactions with pagination, filtering, searching, and sorting."""
    # Base query strictly isolated to current user
    base_filter = [Transaction.user_id == current_user.id]

    if type:
        normalized_type = type.strip().lower()
        if normalized_type in ("income", "expense"):
            base_filter.append(Transaction.type == normalized_type)

    if category and category.strip():
        base_filter.append(Transaction.category.ilike(f"%{category.strip()}%"))

    if start_date:
        base_filter.append(Transaction.transaction_date >= start_date)

    if end_date:
        base_filter.append(Transaction.transaction_date <= end_date)

    if min_amount is not None:
        base_filter.append(Transaction.amount >= min_amount)

    if max_amount is not None:
        base_filter.append(Transaction.amount <= max_amount)

    if search and search.strip():
        term = f"%{search.strip()}%"
        base_filter.append(
            or_(
                Transaction.description.ilike(term),
                Transaction.category.ilike(term)
            )
        )

    # Count total matching rows
    count_stmt = select(func.count()).select_from(Transaction).where(*base_filter)
    total = db.scalar(count_stmt) or 0

    # Calculate total pages
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    # Sorting
    valid_sort_fields = {
        "transaction_date": Transaction.transaction_date,
        "amount": Transaction.amount,
        "created_at": Transaction.created_at,
        "category": Transaction.category,
    }
    sort_col = valid_sort_fields.get(sort_by, Transaction.transaction_date)
    order_func = desc if sort_order.lower() == "desc" else asc

    # Query items with pagination
    offset = (page - 1) * page_size
    query = (
        select(Transaction)
        .where(*base_filter)
        .order_by(order_func(sort_col), desc(Transaction.id))
        .offset(offset)
        .limit(page_size)
    )
    items = db.scalars(query).all()

    return TransactionListResponse(
        items=[TransactionResponse.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new transaction"
)
def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TransactionResponse:
    """Record a new income or expense transaction belonging to the current user."""
    tx = Transaction(
        user_id=current_user.id,
        type=payload.type,
        amount=round(payload.amount, 2),
        category=payload.category,
        description=payload.description,
        transaction_date=payload.transaction_date,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return TransactionResponse.model_validate(tx)


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single transaction by ID"
)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TransactionResponse:
    """Retrieve transaction details ensuring ownership isolation."""
    stmt = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    )
    tx = db.scalars(stmt).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or you do not have permission to view it."
        )
    return TransactionResponse.model_validate(tx)


@router.put(
    "/{transaction_id}",
    response_model=TransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Update an existing transaction"
)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TransactionResponse:
    """Update fields of an existing user transaction."""
    stmt = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    )
    tx = db.scalars(stmt).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or you do not have permission to modify it."
        )

    if payload.type is not None:
        tx.type = payload.type
    if payload.amount is not None:
        tx.amount = round(payload.amount, 2)
    if payload.category is not None:
        tx.category = payload.category
    if payload.description is not None:
        tx.description = payload.description
    if payload.transaction_date is not None:
        tx.transaction_date = payload.transaction_date

    db.commit()
    db.refresh(tx)
    return TransactionResponse.model_validate(tx)


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a transaction"
)
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transaction ensuring user ownership."""
    stmt = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    )
    tx = db.scalars(stmt).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or you do not have permission to delete it."
        )

    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted successfully."}
