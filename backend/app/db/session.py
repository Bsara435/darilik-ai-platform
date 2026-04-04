from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Sync engine — fine for hackathon / moderate traffic; switch to async later if needed.
engine = (
    create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )
    if settings.database_url
    else None
)

SessionLocal = (
    sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None
)
