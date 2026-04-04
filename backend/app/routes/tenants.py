import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.deps import get_db
from app.models.tenant import Tenant
from app.schemas.explanations import ExplanationsRequest, TenantWithExplanation
from app.schemas.tenant import TenantMetricsRead, TenantRankedRead, TenantRead
from app.services.fake_explanations import generate_fake_explanations
from app.services.gemini_service import generate_explanations, merge_with_input
from app.services.metrics import all_scores_for_tenant

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/tenants",
    tags=["tenants"],
)


@router.get(
    "/",
    response_model=list[TenantRead],
    summary="List tenants (raw DB rows)",
    description="No scores here. Use GET /tenants/metrics or /tenants/ranked, or open /debug/tenants in a browser.",
)
def list_tenants(db: Session = Depends(get_db)) -> list[Tenant]:
    """All tenants — raw rows from PostgreSQL (financial/payment/stability scores are computed elsewhere)."""
    return list(db.scalars(select(Tenant).order_by(Tenant.full_name)).all())


@router.get("/metrics", response_model=list[TenantMetricsRead])
def list_tenants_with_metrics(db: Session = Depends(get_db)) -> list[TenantMetricsRead]:
    """Each tenant plus financial, payment, and stability scores (0–100)."""
    tenants = list(db.scalars(select(Tenant).order_by(Tenant.full_name)).all())
    out: list[TenantMetricsRead] = []
    for t in tenants:
        f, p, s, _ = all_scores_for_tenant(t)
        out.append(
            TenantMetricsRead(
                **TenantRead.model_validate(t).model_dump(),
                financial_score=f,
                payment_score=p,
                stability_score=s,
            )
        )
    return out


@router.get("/ranked", response_model=list[TenantRankedRead])
def list_tenants_ranked(db: Session = Depends(get_db)) -> list[TenantRankedRead]:
    """
    Same as /metrics, sorted by combined_score descending:

        combined = 0.4 * financial + 0.4 * payment + 0.2 * stability
    """
    tenants = list(db.scalars(select(Tenant)).all())
    ranked: list[TenantRankedRead] = []
    for t in tenants:
        f, p, s, c = all_scores_for_tenant(t)
        ranked.append(
            TenantRankedRead(
                **TenantRead.model_validate(t).model_dump(),
                financial_score=f,
                payment_score=p,
                stability_score=s,
                combined_score=c,
            )
        )
    ranked.sort(key=lambda x: x.combined_score, reverse=True)
    return ranked


@router.post(
    "/explanations",
    response_model=list[TenantWithExplanation],
    summary="Generate landlord explanations (Gemini or demo mode)",
    description=(
        "Takes scored tenants and returns the same data plus short, non-technical summaries. "
        "If FAKE_GEMINI_EXPLANATIONS=true (default), returns curated Aïn Sebaâ–style copy with no API call. "
        "If false, calls Gemini once — no retries; errors return 502."
    ),
)
def post_tenant_explanations(body: ExplanationsRequest) -> list[TenantWithExplanation]:
    if settings.fake_gemini_explanations:
        logger.info("Using fake Gemini explanations (FAKE_GEMINI_EXPLANATIONS=true)")
        explanations = generate_fake_explanations(body.tenants)
        return merge_with_input(body.tenants, explanations)

    if not (settings.gemini_api_key and settings.gemini_api_key.strip()):
        raise HTTPException(
            status_code=503,
            detail="Gemini is not configured. Set GEMINI_API_KEY or GOOGLE_API_KEY in .env, "
            "or set FAKE_GEMINI_EXPLANATIONS=true for demo mode.",
        )
    try:
        explanations = generate_explanations(
            body.tenants,
            api_key=settings.gemini_api_key.strip(),
            model_name=settings.gemini_model,
        )
        return merge_with_input(body.tenants, explanations)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini request failed: {e!s}",
        ) from e
