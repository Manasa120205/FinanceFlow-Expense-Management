"""Authentication API Endpoints (Register, Login, Me)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.deps import get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account"
)
def register_user(
    payload: UserCreate,
    db: Session = Depends(get_db)
) -> Token:
    """Create a new user profile, verify uniqueness of email, hash password, and return JWT."""
    normalized_email = payload.email.strip().lower()

    # Check for duplicate email
    existing_user = db.scalars(
        select(User).where(User.email == normalized_email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please log in or use another email."
        )

    # Hash password and create user
    hashed_pw = hash_password(payload.password)
    user = User(
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=hashed_pw,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue access token
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and obtain JWT access token"
)
def login_user(
    payload: UserLogin,
    db: Session = Depends(get_db)
) -> Token:
    """Verify user credentials and return a signed JWT token."""
    normalized_email = payload.email.strip().lower()
    user = db.scalars(
        select(User).where(User.email == normalized_email)
    ).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile"
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """Return the profile data for the authenticated user session."""
    return UserResponse.model_validate(current_user)
