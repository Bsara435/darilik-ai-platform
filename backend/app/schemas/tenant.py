from __future__ import annotations

import uuid
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.models.tenant import EmploymentType


class TenantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    age: Annotated[int, Field(ge=0, le=120)]
    monthly_income: float
    employment_type: EmploymentType
    employment_duration_months: Annotated[int, Field(ge=0)]
    target_rent: float
    total_payments: int
    on_time_payments: int
    late_payments: int
    previous_rentals_count: int
    average_stay_months: float


class TenantMetricsRead(TenantRead):
    financial_score: float
    payment_score: float
    stability_score: float


class TenantRankedRead(TenantMetricsRead):
    combined_score: float
