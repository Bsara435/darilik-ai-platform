"""
Landlord-facing explanations via Google Gemini.

Kept separate from HTTP and DB layers so prompts and parsing can evolve independently.
"""

from __future__ import annotations

import logging
from typing import Any

from app.schemas.explanations import (
    GeminiExplanationItem,
    TenantScoresIn,
    TenantWithExplanation,
)
from app.services.explanation_common import (
    LANDLORD_EXPLANATION_SYSTEM_PROMPT,
    build_user_content,
    parse_explanation_json_array,
)

logger = logging.getLogger(__name__)


def _is_quota_or_rate_limit_error(exc: BaseException) -> bool:
    err = str(exc).lower()
    return (
        "429" in str(exc)
        or "quota" in err
        or "rate limit" in err
        or "resource exhausted" in err
        or "too many requests" in err
    )


def _generate_content_gemini(model: Any, user_text: str, generation_config: Any) -> Any:
    """
    Exactly one `generate_content` call per Compare — no retries (each call is billed).
    """
    try:
        return model.generate_content(
            user_text,
            generation_config=generation_config,
        )
    except Exception as e:
        if _is_quota_or_rate_limit_error(e):
            logger.warning("Gemini 429/quota — not retrying (each retry counts as another request)")
            raise RuntimeError(
                "Gemini rate limit or quota (429). Limits apply per **API request**, not per tenant — "
                "comparing 2 people is still one request. Wait a few minutes or until tomorrow for daily "
                "caps, then try Compare again. Details: https://ai.google.dev/gemini-api/docs/rate-limits"
            ) from e
        raise


def generate_explanations(
    tenants: list[TenantScoresIn],
    *,
    api_key: str,
    model_name: str = "gemini-2.0-flash",
) -> list[GeminiExplanationItem]:
    """
    Calls Gemini once (single API request) and returns parsed explanation rows.
    """
    import google.generativeai as genai

    genai.configure(api_key=api_key)

    resolved = (model_name or "").strip() or "gemini-2.0-flash"
    user_text = build_user_content(tenants)
    generation_config = genai.GenerationConfig(
        response_mime_type="application/json",
    )

    model = genai.GenerativeModel(
        model_name=resolved,
        system_instruction=LANDLORD_EXPLANATION_SYSTEM_PROMPT,
    )
    try:
        response = _generate_content_gemini(model, user_text, generation_config)
    except RuntimeError:
        raise
    except Exception as e:
        err_s = str(e)
        if "401" in err_s or "403" in err_s or "API key" in err_s:
            raise RuntimeError(
                "Gemini rejected the API key (invalid, expired, or restricted). "
                "Create a new key at https://aistudio.google.com/apikey"
            ) from e
        if _is_quota_or_rate_limit_error(e):
            raise RuntimeError(
                "Gemini rate limit or quota exceeded (429). Wait a few minutes and try again, "
                "or see https://ai.google.dev/gemini-api/docs/rate-limits"
            ) from e
        raise

    logger.info("Gemini explanations generated with model %r", resolved)

    if not response.candidates:
        block = getattr(response.prompt_feedback, "block_reason", None)
        raise RuntimeError(f"No response from Gemini (blocked or empty). Reason: {block!r}")

    raw_text = (response.text or "").strip()
    if not raw_text:
        raise RuntimeError("Empty response text from Gemini")

    rows = parse_explanation_json_array(raw_text)
    parsed: list[GeminiExplanationItem] = []
    for i, row in enumerate(rows):
        try:
            parsed.append(GeminiExplanationItem.model_validate(row))
        except Exception as e:
            logger.warning("Gemini row %s failed validation: %s — data=%s", i, e, row)
            raise ValueError(f"Invalid explanation object at index {i}") from e

    if len(parsed) != len(tenants):
        raise ValueError(
            f"Expected {len(tenants)} explanations from Gemini, got {len(parsed)}"
        )

    for inp, out in zip(tenants, parsed, strict=True):
        if inp.name.strip().lower() != out.name.strip().lower():
            logger.warning(
                "Name mismatch at position: input=%r output=%r", inp.name, out.name
            )

    return parsed


def merge_with_input(
    tenants: list[TenantScoresIn],
    explanations: list[GeminiExplanationItem],
) -> list[TenantWithExplanation]:
    """Joins request scores with Gemini output (same order)."""
    merged: list[TenantWithExplanation] = []
    for t, e in zip(tenants, explanations, strict=True):
        merged.append(
            TenantWithExplanation(
                name=t.name,
                financial_score=t.financial_score,
                payment_score=t.payment_score,
                stability_score=t.stability_score,
                combined_score=t.combined_score,
                summary=e.summary,
                strengths=e.strengths,
                concerns=e.concerns,
            )
        )
    return merged
