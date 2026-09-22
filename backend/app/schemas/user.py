"""User and Authentication Pydantic Schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128, description="User password (min 8 characters)")
    confirm_password: Optional[str] = Field(None, description="Confirmation password must match password")

    @model_validator(mode="after")
    def verify_passwords_match(self) -> "UserCreate":
        if self.confirm_password is not None and self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        
        # Validate password strength: at least 1 letter and 1 number/symbol
        pw = self.password
        has_letter = any(c.isalpha() for c in pw)
        has_digit_or_punct = any(not c.isalpha() for c in pw)
        if not (has_letter and has_digit_or_punct):
            raise ValueError("Password must contain both letters and numbers/special characters.")
            
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
