import html

from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models.tenant import Tenant
from app.services.metrics import all_scores_for_tenant

router = APIRouter(prefix="/debug", tags=["debug"])


_PAGE_STYLE = """
  :root { font-family: system-ui, Segoe UI, sans-serif; background: #0f172a; color: #e2e8f0; }
  body { margin: 0; padding: 1.5rem; max-width: 1200px; margin-inline: auto; }
  h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
  p { color: #94a3b8; font-size: 0.9rem; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.85rem; }
  th, td { border: 1px solid #334155; padding: 0.5rem 0.6rem; text-align: left; }
  th { background: #1e293b; position: sticky; top: 0; }
  tr:nth-child(even) { background: #1e293b55; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  a { color: #38bdf8; }
"""


@router.get("/tenants", response_class=HTMLResponse)
def debug_tenants_table(db: Session = Depends(get_db)) -> HTMLResponse:
    """Hackathon-friendly HTML table of tenants and scores (no frontend required)."""
    tenants = list(db.scalars(select(Tenant).order_by(Tenant.full_name)).all())
    rows_html: list[str] = []
    for t in tenants:
        f, p, s, c = all_scores_for_tenant(t)
        name = html.escape(t.full_name)
        rows_html.append(
            "<tr>"
            f"<td>{name}</td>"
            f'<td class="num">{t.monthly_income:,.0f}</td>'
            f'<td class="num">{t.target_rent:,.0f}</td>'
            f'<td class="num">{f:.1f}</td>'
            f'<td class="num">{p:.1f}</td>'
            f'<td class="num">{s:.1f}</td>'
            f'<td class="num"><strong>{c:.1f}</strong></td>'
            "</tr>"
        )

    body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DariLik — Tenant scores (debug)</title>
  <style>{_PAGE_STYLE}</style>
</head>
<body>
  <h1>Tenant evaluation (debug)</h1>
  <p>
    Income &amp; rent in MAD (Casablanca-style fake data).
    Scores 0–100. Combined = 0.4×financial + 0.4×payment + 0.2×stability.
    JSON: <a href="/tenants/ranked">/tenants/ranked</a>
  </p>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th class="num">Monthly income</th>
        <th class="num">Target rent</th>
        <th class="num">Financial</th>
        <th class="num">Payment</th>
        <th class="num">Stability</th>
        <th class="num">Combined</th>
      </tr>
    </thead>
    <tbody>
      {"".join(rows_html)}
    </tbody>
  </table>
</body>
</html>"""
    return HTMLResponse(content=body)
