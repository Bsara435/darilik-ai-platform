"""Legal Advisor API — post-visit, conflicts, contract, docx, signed upload."""

from __future__ import annotations

import io
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.deps import get_db
from app.models.legal import ConflictResolution, LegalContract, PostVisitForm
from app.models.tenant import Tenant
from app.schemas.legal import (
    AgreedPointOut,
    ConflictOut,
    DetectConflictsRequest,
    DetectConflictsResponse,
    GenerateContractRequest,
    GenerateContractResponse,
    PostVisitCreate,
    PostVisitResponse,
    ResolveConflictBody,
    UploadSignedResponse,
)
from app.services.legal_llm import contract_text_to_html, generate_contract_body, run_conflict_detection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/legal", tags=["legal"])

UPLOAD_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads" / "legal"


def _slug_filename(name: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9._-]+", "_", name)[:120]
    return safe or "upload.bin"


@router.post("/post-visit", response_model=PostVisitResponse)
def post_visit(body: PostVisitCreate, db: Session = Depends(get_db)) -> PostVisitResponse:
    tenant = db.get(Tenant, body.tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")

    row = PostVisitForm(
        landlord_id=1,
        tenant_id=body.tenant_id,
        property_id=body.property_id,
        property_address=body.property_address,
        agreed_rent=body.agreed_rent_mad,
        agreed_deposit=body.deposit_months,
        agreed_move_in=body.move_in_date,
        agreed_duration=body.lease_duration,
        agreed_payment_method=body.payment_method,
        special_conditions=body.special_conditions,
        landlord_concerns=body.landlord_concerns,
        contract_language=body.contract_language,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return PostVisitResponse(visit_id=row.id)


@router.post("/detect-conflicts", response_model=DetectConflictsResponse)
def detect_conflicts(body: DetectConflictsRequest, db: Session = Depends(get_db)) -> DetectConflictsResponse:
    form = db.get(PostVisitForm, body.visit_id)
    if form is None:
        raise HTTPException(status_code=404, detail="Visit not found")
    tenant = db.get(Tenant, form.tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant missing")

    data = run_conflict_detection(form, tenant)

    db.execute(delete(ConflictResolution).where(ConflictResolution.visit_id == form.id))
    db.flush()

    conflicts_out: list[ConflictOut] = []
    for c in data.get("conflicts", []):
        if not isinstance(c, dict):
            continue
        cr = ConflictResolution(
            visit_id=form.id,
            field=str(c.get("field", "unknown")),
            landlord_position=str(c.get("landlordWants", "")),
            tenant_position=str(c.get("tenantDeclared", "")),
            legal_note=c.get("legalNote"),
            mediation_question=c.get("question"),
            resolved=False,
            agreed_value=None,
        )
        db.add(cr)
        db.flush()
        conflicts_out.append(
            ConflictOut(
                id=cr.id,
                field=cr.field,
                landlord_wants=cr.landlord_position,
                tenant_declared=cr.tenant_position,
                legal_note=cr.legal_note,
                question=cr.mediation_question,
                resolved=False,
                agreed_value=None,
            )
        )

    db.commit()

    agreed_points = [
        AgreedPointOut(field=str(x.get("field", "")), value=str(x.get("value", "")))
        for x in data.get("agreedPoints", [])
        if isinstance(x, dict)
    ]

    return DetectConflictsResponse(agreed_points=agreed_points, conflicts=conflicts_out)


@router.patch("/conflicts/{conflict_id}/resolve", response_model=ConflictOut)
def resolve_conflict(
    conflict_id: int,
    body: ResolveConflictBody,
    db: Session = Depends(get_db),
) -> ConflictOut:
    row = db.get(ConflictResolution, conflict_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Conflict not found")
    row.resolved = body.resolved
    if body.resolved:
        row.agreed_value = (body.agreed_value or row.landlord_position or "").strip() or None
    else:
        row.agreed_value = None
    db.commit()
    db.refresh(row)
    return ConflictOut(
        id=row.id,
        field=row.field,
        landlord_wants=row.landlord_position,
        tenant_declared=row.tenant_position,
        legal_note=row.legal_note,
        question=row.mediation_question,
        resolved=row.resolved,
        agreed_value=row.agreed_value,
    )


def _all_conflicts_resolved(db: Session, visit_id: int) -> bool:
    rows = list(db.scalars(select(ConflictResolution).where(ConflictResolution.visit_id == visit_id)).all())
    if not rows:
        return True
    return all(r.resolved for r in rows)


@router.post("/generate-contract", response_model=GenerateContractResponse)
def generate_contract(body: GenerateContractRequest, db: Session = Depends(get_db)) -> GenerateContractResponse:
    form = db.get(PostVisitForm, body.visit_id)
    if form is None:
        raise HTTPException(status_code=404, detail="Visit not found")
    tenant = db.get(Tenant, form.tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant missing")

    if not _all_conflicts_resolved(db, form.id):
        raise HTTPException(
            status_code=400,
            detail="Every conflict must be resolved (agreed value confirmed) before generating the contract.",
        )

    resolved_rows = list(db.scalars(select(ConflictResolution).where(ConflictResolution.visit_id == form.id)).all())
    text = generate_contract_body(form, tenant, resolved_rows)
    html_doc = contract_text_to_html(text, form.contract_language or "ar")

    db.execute(delete(LegalContract).where(LegalContract.visit_id == form.id))
    db.flush()

    contract = LegalContract(
        visit_id=form.id,
        landlord_id=form.landlord_id,
        tenant_id=form.tenant_id,
        property_id=form.property_id,
        contract_text=text,
        contract_html=html_doc,
        status="ready",
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)

    rent_summary = f"{int(form.agreed_rent):,} MAD/month".replace(",", " ")
    return GenerateContractResponse(
        contract_id=contract.id,
        contract_html=html_doc,
        landlord_name=settings.legal_landlord_full_name,
        tenant_name=tenant.full_name,
        property_address=form.property_address,
        rent_summary=rent_summary,
        duration_summary=form.agreed_duration,
        status=contract.status,
    )


@router.get("/contracts/{contract_id}/docx")
def download_docx(contract_id: int, db: Session = Depends(get_db)) -> Response:
    row = db.get(LegalContract, contract_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    text = row.contract_text or ""
    try:
        from docx import Document

        doc = Document()
        for block in text.split("\n\n"):
            p = block.strip()
            if p:
                doc.add_paragraph(p)
        buf = io.BytesIO()
        doc.save(buf)
        data = buf.getvalue()
        return Response(
            content=data,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="contract-{contract_id}.docx"'},
        )
    except ImportError:
        logger.info("python-docx not installed — serving contract as UTF-8 text (demo)")
        body = ("\ufeff" + text).encode("utf-8-sig")
        return Response(
            content=body,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="contract-{contract_id}.txt"'},
        )
    except Exception as e:
        logger.warning("DOCX build failed (%s) — falling back to plain text", e)
        body = ("\ufeff" + text).encode("utf-8-sig")
        return Response(
            content=body,
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="contract-{contract_id}.txt"'},
        )


@router.post("/contracts/{contract_id}/upload-signed", response_model=UploadSignedResponse)
async def upload_signed(
    contract_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> UploadSignedResponse:
    row = db.get(LegalContract, contract_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    fname = _slug_filename(file.filename or "signed.jpg")
    dest = UPLOAD_ROOT / f"{contract_id}_{fname}"
    content = await file.read()
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 8MB)")
    dest.write_bytes(content)
    rel = f"/api/legal/uploads/{contract_id}/{fname}"
    row.signed_copy_url = rel
    row.status = "signed"
    row.signed_at = datetime.now(timezone.utc)
    db.commit()
    return UploadSignedResponse(ok=True, signed_copy_url=rel, status=row.status)


@router.get("/uploads/{contract_id}/{filename}")
def serve_upload(contract_id: int, filename: str, db: Session = Depends(get_db)) -> Response:
    row = db.get(LegalContract, contract_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    safe = _slug_filename(filename)
    path = UPLOAD_ROOT / f"{contract_id}_{safe}"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    lower = safe.lower()
    mt = "application/octet-stream"
    if lower.endswith((".jpg", ".jpeg")):
        mt = "image/jpeg"
    elif lower.endswith(".png"):
        mt = "image/png"
    elif lower.endswith(".webp"):
        mt = "image/webp"
    elif lower.endswith(".pdf"):
        mt = "application/pdf"
    return Response(content=path.read_bytes(), media_type=mt)
