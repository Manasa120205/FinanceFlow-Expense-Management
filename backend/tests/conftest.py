"""Pytest Test Configuration and Fixtures."""
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.main import app
from app.models.user import User

# In-memory SQLite database specifically for test isolation
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh database tables before each test and drop after."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def auth_user_a(db_session):
    """Create authenticated User A."""
    user = User(
        name="User Alpha",
        email="alpha@example.com",
        password_hash=hash_password("AlphaPass123!"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "user": user,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }


@pytest.fixture(scope="function")
def auth_user_b(db_session):
    """Create authenticated User B."""
    user = User(
        name="User Beta",
        email="beta@example.com",
        password_hash=hash_password("BetaPass123!"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "user": user,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }
