"""Claude calls for Legal Advisor (conflicts + lease). Templates (AR/FR/EN) or Claude (Arabic-only path)."""

from __future__ import annotations

import html
import json
import logging
import re
from typing import Any

from app.core.config import settings
from app.models.legal import PostVisitForm
from app.models.tenant import EmploymentType, Tenant
from app.services.legal_lease_templates import render_lease

logger = logging.getLogger(__name__)

DETECT_SYSTEM = """You are a rental mediator for DariLik, a Moroccan property platform.
You compare landlord post-visit notes with tenant onboarding data, find disagreements, and cite Law 67.12 where relevant (e.g. deposit capped at 2 months).
Return ONLY valid JSON, no markdown fences."""

DETECT_USER_TEMPLATE = """
LANDLORD POST-VISIT FORM:
{landlord_post_visit}

TENANT ONBOARDING PROFILE:
{tenant_profile}

Compare every field. Find all disagreements.
For each conflict check Moroccan Law 67.12.

Return ONLY this JSON shape:
{{
  "agreedPoints": [
    {{ "field": "rent", "value": "5500 MAD/month" }}
  ],
  "conflicts": [
    {{
      "field": "deposit",
      "landlordWants": "3 months",
      "tenantDeclared": "1 month",
      "legalNote": "Law 67.12 caps deposit at 2 months maximum",
      "question": "You want 3 months but tenant declared 1 month. Law caps at 2 months. Did you agree during the visit?"
    }}
  ]
}}
"""

CONTRACT_SYSTEM = """أنت محامٍ مغربي متخصص في القانون العقاري.
تكتب بالعربية القانونية الفصيحة المستخدمة في التوثيق المغربي.
تطبق القانون رقم 67.12 بشكل صارم.
لا دارجة مغربية إطلاقاً. الأرقام بالأرقام والحروف معاً حيث يلزم.
ابدأ مباشرة بعنوان عقد الكراء دون مقدمات طويلة."""

CONTRACT_USER_TEMPLATE = """
قم بتوليد عقد كراء سكني كامل باللغة العربية.

اتبع هذا الهيكل بدقة (النمط المغربي الرسمي):

العنوان: "عقـد كـراء"
(مُحرَّر وفق مقتضيات القانون رقم 67.12)

الديباجة مع بيانات الطرفين كما يلي:
الطرف الأول (المكري): {landlord_block}
الطرف الثاني (المكتري): {tenant_block}

الفصل الأول — وصف العقار: {property_block}
الفصل الثاني — السومة الكرائية
الفصل الثالث — مدة العقد
الفصل الرابع — شروط الكراء والتزامات المكتري
الفصل الخامس — الضمانة الكرائية (الالتزام بحد أقصى شهرين وفق القانون 67.12)
الفصل السادس — اختيار الموطن

أضف فصولاً للشروط الخاصة إن وُجدت في البيانات.

الخاتمة مع تاريخ التحرير ومواضع الإمضاء.

البيانات المتفق عليها (JSON):
{all_agreed_data}
"""


def _strip_json_fence(raw: str) -> str:
    t = raw.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def landlord_post_visit_text(form: PostVisitForm) -> str:
    return json.dumps(
        {
            "agreed_rent_mad": form.agreed_rent,
            "deposit": form.agreed_deposit,
            "move_in": str(form.agreed_move_in),
            "lease_duration": form.agreed_duration,
            "payment_method": form.agreed_payment_method,
            "special_conditions": form.special_conditions or "",
            "landlord_concerns": form.landlord_concerns or "",
            "property_address": form.property_address or "",
        },
        ensure_ascii=False,
        indent=2,
    )


def tenant_profile_text(tenant: Tenant) -> str:
    emp = tenant.employment_type
    emp_ar = {
        EmploymentType.CDI: "أجير بعقد عمل محدد المدة أو غير محدد",
        EmploymentType.FREELANCER: "عمل حر",
        EmploymentType.STUDENT: "طالب",
        EmploymentType.UNEMPLOYED: "غير مشغول",
    }.get(emp, str(emp))
    return json.dumps(
        {
            "full_name": tenant.full_name,
            "age": tenant.age,
            "declared_target_rent_mad": tenant.target_rent,
            "monthly_income_mad": tenant.monthly_income,
            "employment": str(emp),
            "employment_ar_hint": emp_ar,
            "rental_history_payments": {
                "total": tenant.total_payments,
                "on_time": tenant.on_time_payments,
                "late": tenant.late_payments,
            },
            "simulated_onboarding_preferences": {
                "deposit_preference": "1 month",
                "lease_preference": "1 year renewable",
                "payment_preference": "bank transfer",
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def mock_detect_json(form: PostVisitForm, tenant: Tenant) -> dict[str, Any]:
    """Deterministic demo when ANTHROPIC_API_KEY is unset."""
    rent = int(form.agreed_rent)
    agreed: list[dict[str, str]] = [
        {"field": "rent", "value": f"{rent:,} MAD/month".replace(",", " ")},
        {"field": "move_in", "value": str(form.agreed_move_in)},
        {"field": "payment_method", "value": form.agreed_payment_method},
    ]
    conflicts: list[dict[str, str]] = []
    if "3" in form.agreed_deposit or form.agreed_deposit.lower().startswith("3"):
        conflicts.append(
            {
                "field": "deposit",
                "landlordWants": form.agreed_deposit,
                "tenantDeclared": "1 month (onboarding)",
                "legalNote": "Law 67.12 — maximum deposit is 2 months",
                "question": "Deposit exceeds legal cap or differs from tenant declaration. Did you agree on 2 months or less during the visit?",
            }
        )
    elif "cash" in form.agreed_payment_method.lower():
        conflicts.append(
            {
                "field": "payment_method",
                "landlordWants": form.agreed_payment_method,
                "tenantDeclared": "bank transfer (onboarding preference)",
                "legalNote": None,
                "question": "Payment channel differs from what the tenant profile suggests. Did you confirm cash payment during the visit?",
            }
        )
    return {"agreedPoints": agreed, "conflicts": conflicts}


def call_claude_detect(landlord_blob: str, tenant_blob: str) -> dict[str, Any]:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    user = DETECT_USER_TEMPLATE.format(
        landlord_post_visit=landlord_blob,
        tenant_profile=tenant_blob,
    )
    msg = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=2048,
        system=DETECT_SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    text = ""
    for block in msg.content:
        if block.type == "text":
            text += block.text
    data = json.loads(_strip_json_fence(text))
    if not isinstance(data.get("agreedPoints"), list):
        data["agreedPoints"] = []
    if not isinstance(data.get("conflicts"), list):
        data["conflicts"] = []
    return data


def run_conflict_detection(form: PostVisitForm, tenant: Tenant) -> dict[str, Any]:
    if settings.fake_legal_advisor:
        logger.info("FAKE_LEGAL_ADVISOR=true — mock conflict detection")
        return mock_detect_json(form, tenant)
    landlord_blob = landlord_post_visit_text(form)
    tenant_blob = tenant_profile_text(tenant)
    if not (settings.anthropic_api_key and settings.anthropic_api_key.strip()):
        logger.warning("ANTHROPIC_API_KEY missing — using mock conflict detection")
        return mock_detect_json(form, tenant)
    try:
        return call_claude_detect(landlord_blob, tenant_blob)
    except Exception as e:
        logger.exception("Claude conflict detection failed: %s", e)
        return mock_detect_json(form, tenant)


def landlord_block_ar() -> str:
    return (
        f"السيد {settings.legal_landlord_full_name}، مغربي الجنسية، "
        f"الحامل لبطاقة التعريف الوطنية رقم {settings.legal_landlord_cin}، "
        f"والساكن ب{settings.legal_landlord_address}، مهنته {settings.legal_landlord_profession}، بصفته مكرياً"
    )


def tenant_block_ar(tenant: Tenant) -> str:
    cin = settings.demo_tenant_cin_placeholder
    addr = settings.demo_tenant_address_placeholder
    emp_ar = {
        EmploymentType.CDI: "موظف",
        EmploymentType.FREELANCER: "أجير حر",
        EmploymentType.STUDENT: "طالب",
        EmploymentType.UNEMPLOYED: "غير مشغول",
    }.get(tenant.employment_type, "—")
    return (
        f"السيد {tenant.full_name}، مغربي الجنسية، "
        f"الحامل لبطاقة التعريف الوطنية رقم {cin}، "
        f"والساكن ب{addr}، مهنته {emp_ar}، بصفته مكترياً"
    )


def call_claude_contract(all_agreed_data: str, form: PostVisitForm, tenant: Tenant) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    prop = form.property_address or "سكن بالدار البيضاء"
    user = CONTRACT_USER_TEMPLATE.format(
        landlord_block=landlord_block_ar(),
        tenant_block=tenant_block_ar(tenant),
        property_block=prop,
        all_agreed_data=all_agreed_data,
    )
    msg = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=4000,
        system=CONTRACT_SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    text = ""
    for block in msg.content:
        if block.type == "text":
            text += block.text
    return text.strip()


def build_agreed_payload(form: PostVisitForm, resolved_rows: list[Any]) -> dict[str, Any]:
    overrides = {r.field: r.agreed_value for r in resolved_rows if r.resolved and r.agreed_value}
    return {
        "rent_mad": form.agreed_rent,
        "deposit": overrides.get("deposit", form.agreed_deposit),
        "move_in": str(form.agreed_move_in),
        "duration": overrides.get("lease_duration", form.agreed_duration),
        "payment_method": overrides.get("payment_method", form.agreed_payment_method),
        "special_conditions": form.special_conditions,
        "property_address": form.property_address,
        "conflict_resolutions": [
            {"field": r.field, "agreed_value": r.agreed_value, "resolved": r.resolved} for r in resolved_rows
        ],
    }


def generate_contract_body(form: PostVisitForm, tenant: Tenant, resolved_rows: list[Any]) -> str:
    payload = build_agreed_payload(form, resolved_rows)
    blob = json.dumps(payload, ensure_ascii=False, indent=2)
    lang = getattr(form, "contract_language", None) or "ar"
    use_claude = (
        not settings.fake_legal_advisor
        and bool(settings.anthropic_api_key and settings.anthropic_api_key.strip())
        and lang == "ar"
    )
    if not use_claude:
        if settings.fake_legal_advisor:
            logger.info("FAKE_LEGAL_ADVISOR=true — structured lease (%s)", lang)
        elif lang != "ar":
            logger.info("Contract language %s — structured lease template", lang)
        else:
            logger.warning("ANTHROPIC_API_KEY missing — structured lease template")
        return render_lease(form, tenant, lang)
    try:
        return call_claude_contract(blob, form, tenant)
    except Exception as e:
        logger.exception("Claude contract failed: %s", e)
        return render_lease(form, tenant, lang)


def contract_text_to_html(contract_text: str, language: str = "ar") -> str:
    lang = (language or "ar").strip().lower()[:2]
    if lang not in ("ar", "fr", "en"):
        lang = "ar"
    rtl = lang == "ar"
    dir_ = "rtl" if rtl else "ltr"
    html_lang = {"ar": "ar", "fr": "fr", "en": "en"}[lang]
    if rtl:
        font_link = (
            '<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet" />'
        )
        body_style = (
            "font-family: 'Amiri', 'Noto Naskh Arabic', serif; direction: rtl; "
            "padding: 40px 48px; font-size: 14px; line-height: 2.2; color: #111;"
        )
        sig = "<span>إمضاء المكري: __________</span><span>إمضاء المكتري: __________</span>"
    else:
        font_link = ""
        body_style = (
            "font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; direction: ltr; "
            "padding: 40px 48px; font-size: 14px; line-height: 2; color: #111;"
        )
        sig = "<span>LANDLORD __________</span><span>TENANT __________</span>"
        if lang == "fr":
            sig = "<span>LE BAILLEUR __________</span><span>LE LOCATAIRE __________</span>"
    safe = html.escape(contract_text)
    body = safe.replace("\n", "<br />\n")
    return f"""<!DOCTYPE html>
<html dir="{dir_}" lang="{html_lang}">
<head>
  <meta charset="UTF-8" />
  {font_link}
  <style>
    body {{ {body_style} }}
    .signatures {{ display: flex; justify-content: space-between; margin-top: 80px; font-weight: 700; }}
    @media print {{ .no-print {{ display: none !important; }} }}
  </style>
</head>
<body>
  <div class="contract-body">{body}</div>
  <div class="signatures">{sig}</div>
</body>
</html>"""
