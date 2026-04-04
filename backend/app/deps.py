from collections.abc import Generator

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yields a DB session; returns 503 when DATABASE_URL is missing."""
    if SessionLocal is None:
        raise HTTPException(
            status_code=503,
            detail="DATABASE_URL is not configured. Copy backend/.env.example to backend/.env.",
        )
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
