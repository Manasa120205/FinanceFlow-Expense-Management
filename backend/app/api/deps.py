"""API Dependencies, including Database Session and User Authentication."""
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate Bearer JWT token and return the authenticated User instance."""
    unauthorized_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials or not credentials.credentials:
        raise unauthorized_exception

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise unauthorized_exception

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise unauthorized_exception

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise unauthorized_exception

    stmt = select(User).where(User.id == user_id)
    user = db.scalars(stmt).first()
    
    if not user:
        raise unauthorized_exception

    return user
