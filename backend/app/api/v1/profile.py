"""User Profile Management API Endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.put(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user's profile details"
)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """Update profile information (e.g. name) for the authenticated user."""
    current_user.name = payload.name.strip()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
