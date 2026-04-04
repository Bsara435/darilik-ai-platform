from __future__ import annotations

from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class PostVisitCreate(BaseModel):
    tenant_id: UUID
    property_id: str | None = None
    property_address: str | None = None
    contract_language: Literal["ar", "fr", "en"] = "ar"
    agreed_rent_mad: float = Field(..., gt=0)
    deposit_months: str
    move_in_date: date
    lease_duration: str
    payment_method: str
    special_conditions: str | None = None
    landlord_concerns: str | None = None

    @field_validator("deposit_months")
    @classmethod
    def normalize_deposit(cls, v: str) -> str:
        s = (v or "").strip().lower()
        if s in ("1", "1 month", "1 months", "one month"):
            return "1 month"
        if s in ("2", "2 months", "two months"):
            return "2 months"
        raise ValueError('deposit_months must be "1 month" or "2 months"')


class PostVisitResponse(BaseModel):
    visit_id: int


class DetectConflictsRequest(BaseModel):
    visit_id: int


class AgreedPointOut(BaseModel):
    field: str
    value: str


class ConflictOut(BaseModel):
    id: int
    field: str
    landlord_wants: str
    tenant_declared: str
    legal_note: str | None = None
    question: str | None = None
    resolved: bool
    agreed_value: str | None = None


class DetectConflictsResponse(BaseModel):
    agreed_points: list[AgreedPointOut]
    conflicts: list[ConflictOut]


class ResolveConflictBody(BaseModel):
    resolved: bool
    agreed_value: str | None = None


class GenerateContractRequest(BaseModel):
    visit_id: int


class GenerateContractResponse(BaseModel):
    contract_id: int
    contract_html: str
    landlord_name: str
    tenant_name: str
    property_address: str | None
    rent_summary: str
    duration_summary: str
    status: str


class UploadSignedResponse(BaseModel):
    ok: bool
    signed_copy_url: str
    status: str
