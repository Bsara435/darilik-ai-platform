from __future__ import annotations

from pydantic import BaseModel, Field


class TenantScoresIn(BaseModel):
    """Payload item: top tenants with evaluation scores (from ranking or client)."""

    name: str = Field(..., min_length=1)
    financial_score: float
    payment_score: float
    stability_score: float
    combined_score: float


class ExplanationsRequest(BaseModel):
    tenants: list[TenantScoresIn] = Field(..., min_length=1)


class GeminiExplanationItem(BaseModel):
    """Parsed shape from Gemini JSON output."""

    name: str
    summary: str
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)


class TenantWithExplanation(BaseModel):
    """Original scores plus landlord-facing explanation (no scoring formulas)."""

    name: str
    financial_score: float
    payment_score: float
    stability_score: float
    combined_score: float
    summary: str
    strengths: list[str]
    concerns: list[str]
