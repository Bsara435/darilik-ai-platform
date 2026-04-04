"""
Tenant scoring — deterministic rules (no ML / external APIs).

All public scores are on a 0–100 scale for easy comparison in dashboards and /debug/tenants.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.models.tenant import EmploymentType

if TYPE_CHECKING:
    from app.models.tenant import Tenant

# --- Employment weights (spec) ---
_EMPLOYMENT_WEIGHT: dict[EmploymentType, float] = {
    EmploymentType.CDI: 1.0,
    EmploymentType.FREELANCER: 0.7,
    EmploymentType.STUDENT: 0.5,
    EmploymentType.UNEMPLOYED: 0.2,
}

# Financial: treat income ≥ RATIO_CAP × rent as "saturated" good capacity (reduces sensitivity to outliers).
_RATIO_CAP = 5.0

# Stability: theoretical upper bound for linear normalization (months + rental count scale).
_STABILITY_STAY_CAP = 48.0
_STABILITY_RENTALS_CAP = 8.0


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def compute_financial_score(tenant: Tenant) -> float:
    """
    (1) Financial reliability

    Base signals:
    - rent_to_income_ratio = monthly_income / target_rent
      (how many times monthly rent fits inside one month of income; higher is safer)

    Spec-shaped blend before normalization:
        raw_blend = (min(ratio, RATIO_CAP) * 0.6) + (employment_weight * 0.4)

    We then rescale raw_blend into [0, 100] using the min/max possible given RATIO_CAP and weights:
    - min_raw ≈ 0 * 0.6 + 0.2 * 0.4 = 0.08
    - max_raw = RATIO_CAP * 0.6 + 1.0 * 0.4
    """
    if tenant.target_rent <= 0:
        return 0.0

    ratio = tenant.monthly_income / tenant.target_rent
    weight = _EMPLOYMENT_WEIGHT[tenant.employment_type]
    capped_ratio = min(ratio, _RATIO_CAP)
    raw_blend = capped_ratio * 0.6 + weight * 0.4

    min_raw = 0.0 * 0.6 + _EMPLOYMENT_WEIGHT[EmploymentType.UNEMPLOYED] * 0.4
    max_raw = _RATIO_CAP * 0.6 + _EMPLOYMENT_WEIGHT[EmploymentType.CDI] * 0.4

    if max_raw <= min_raw:
        return 0.0
    normalized = (raw_blend - min_raw) / (max_raw - min_raw)
    return round(100.0 * _clamp(normalized, 0.0, 1.0), 2)


def compute_payment_score(tenant: Tenant) -> float:
    """
    (2) Payment behavior

    on_time_rate = on_time_payments / total_payments
    late_penalty = late_payments / total_payments

    Spec:
        payment_raw = (on_time_rate * 0.8) - (late_penalty * 0.2)

    When total_payments == 0, we return a neutral 50.0 (no evidence either way).
    Otherwise map payment_raw from [-0.2, 0.8] linearly to [0, 100].
    """
    total = tenant.total_payments
    if total <= 0:
        return 50.0

    on_time_rate = tenant.on_time_payments / total
    late_penalty = tenant.late_payments / total
    payment_raw = on_time_rate * 0.8 - late_penalty * 0.2
    # Affine map: raw -0.2 -> 0, raw 0.8 -> 100
    payment_score = (payment_raw + 0.2) / 1.0 * 100.0
    return round(_clamp(payment_score, 0.0, 100.0), 2)


def compute_stability_score(tenant: Tenant) -> float:
    """
    (3) Stability

    Spec:
        stability_raw = (average_stay_months * 0.7) + (previous_rentals_count * 0.3)

    Normalize to 0–100 by comparing to soft caps (long stays + several past leases = top of range).
    """
    raw = tenant.average_stay_months * 0.7 + tenant.previous_rentals_count * 0.3
    denom = _STABILITY_STAY_CAP * 0.7 + _STABILITY_RENTALS_CAP * 0.3
    if denom <= 0:
        return 0.0
    normalized = raw / denom
    return round(100.0 * _clamp(normalized, 0.0, 1.0), 2)


def compute_combined_score(financial: float, payment: float, stability: float) -> float:
    """
    Weighted overall score for ranking.

        combined = 0.4 * financial + 0.4 * payment + 0.2 * stability
    """
    return round(0.4 * financial + 0.4 * payment + 0.2 * stability, 2)


def all_scores_for_tenant(tenant: Tenant) -> tuple[float, float, float, float]:
    """Returns (financial_score, payment_score, stability_score, combined_score)."""
    f = compute_financial_score(tenant)
    p = compute_payment_score(tenant)
    s = compute_stability_score(tenant)
    c = compute_combined_score(f, p, s)
    return f, p, s, c
