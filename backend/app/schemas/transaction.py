"""Transaction Request and Response Pydantic Schemas."""
from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


# Common initial category lists (for guidance and validation defaults)
INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Business",
    "Investment",
    "Other Income"
]

EXPENSE_CATEGORIES = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Education",
    "Entertainment",
    "Healthcare",
    "Rent",
    "Travel",
    "Other"
]

TransactionType = Literal["income", "expense"]


class TransactionBase(BaseModel):
    type: TransactionType = Field(..., description="Transaction type: income or expense")
    amount: float = Field(..., gt=0, description="Amount must be greater than 0")
    category: str = Field(..., min_length=1, max_length=50, description="Transaction category")
    description: Optional[str] = Field(None, max_length=255, description="Optional description of the transaction")
    transaction_date: date = Field(..., description="Date of the transaction (YYYY-MM-DD)")

    @field_validator("category")
    @classmethod
    def clean_category(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Category cannot be empty or blank.")
        return clean

    @field_validator("description")
    @classmethod
    def clean_description(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            return v if v else None
        return None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    type: Optional[TransactionType] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    transaction_date: Optional[date] = None

    @field_validator("category")
    @classmethod
    def clean_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if not clean:
                raise ValueError("Category cannot be empty or blank.")
            return clean
        return None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
