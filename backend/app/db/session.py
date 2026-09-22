"""Database Session Management and Engine Creation."""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

# Engine configuration with dialect detection
database_url = settings.normalized_database_url
connect_args = {}

if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        database_url,
        connect_args=connect_args,
        echo=False
    )
else:
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for yielding database sessions per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
