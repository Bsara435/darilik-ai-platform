from __future__ import annotations

import enum
import uuid

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EmploymentType(str, enum.Enum):
    """How the tenant earns income — used as a solvency / predictability signal."""

    CDI = "CDI"
    FREELANCER = "freelancer"
    STUDENT = "student"
    UNEMPLOYED = "unemployed"


class Tenant(Base):
    """
    Tenant profile for evaluation (Casablanca-oriented rent/income assumptions in MAD).
    """

    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)

    monthly_income: Mapped[float] = mapped_column(Float, nullable=False)
    employment_type: Mapped[EmploymentType] = mapped_column(
        SQLEnum(EmploymentType, native_enum=False, length=20),
        nullable=False,
    )
    employment_duration_months: Mapped[int] = mapped_column(Integer, nullable=False)

    target_rent: Mapped[float] = mapped_column(Float, nullable=False)

    total_payments: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    on_time_payments: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    late_payments: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    previous_rentals_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    average_stay_months: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
