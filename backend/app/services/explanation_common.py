"""
Shared prompt, user payload, and JSON parsing for LLM-backed tenant explanations.
"""

from __future__ import annotations

import json
import re
from typing import Any

from app.schemas.explanations import TenantScoresIn

# Instruction block (fixed). Tenant JSON is appended separately so the model can reason on data
# without echoing formulas to the user.
LANDLORD_EXPLANATION_SYSTEM_PROMPT = """You are a property management assistant helping a landlord choose between tenants.

For each tenant, write a short, clear explanation (3–5 lines max) explaining:

* Why this tenant is a good candidate
* Any potential concerns (if any)
* Keep it simple and non-technical
* Do NOT mention scores or numbers
* Use a professional but friendly tone

Highlight:

* Financial reliability
* Payment behavior
* Stability

Return the result as JSON like this:

[
{
"name": "...",
"summary": "...",
"strengths": ["...", "..."],
"concerns": ["..."]
}
]

Return ONLY a JSON array, one object per tenant, in the SAME ORDER as the tenants provided.
Each "concerns" array may be empty if there are no material concerns.
Strengths should be 2–4 short phrases; concerns 0–3 short phrases.
Make each tenant feel distinct; avoid repeating the same generic lines."""


def strip_code_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def parse_explanation_json_array(raw: str) -> list[dict[str, Any]]:
    cleaned = strip_code_fence(raw)
    data = json.loads(cleaned)
    if not isinstance(data, list):
        raise ValueError("LLM response is not a JSON array")
    return data


def build_user_content(tenants: list[TenantScoresIn]) -> str:
    """Serializes tenant scoring data for the model (used only for reasoning)."""
    payload = [t.model_dump() for t in tenants]
    return (
        "Tenant data (use for judgment only; your written output must not mention "
        "any numbers, percentages, or the word 'score'):\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )
