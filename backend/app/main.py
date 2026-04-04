from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from app.core.config import settings
from app.routes import api, debug_tenants, health, legal, tenants


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Create tables when DATABASE_URL is set (Supabase / local Postgres).
    from app.db.base import Base
    from app.db.session import engine

    if engine is not None:
        from app.models.legal import ConflictResolution, LegalContract, PostVisitForm  # noqa: F401
        from app.models.tenant import Tenant  # noqa: F401 — register model

        Base.metadata.create_all(bind=engine)
        from app.db.schema_patches import apply_schema_patches

        apply_schema_patches(engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description="Backend API for DariLik — Moroccan proptech (tenant evaluation, portfolio ops).",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(api.router, prefix=settings.api_v1_prefix)
app.include_router(tenants.router)
app.include_router(debug_tenants.router)
app.include_router(legal.router)


@app.get("/tenants", include_in_schema=False)
def tenants_no_trailing_slash() -> RedirectResponse:
    """Accept `GET /tenants` as well as `GET /tenants/` (router uses trailing slash)."""
    return RedirectResponse(url="/tenants/", status_code=307)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "app": settings.app_name,
        "docs": "/docs",
        "note": "Scores are not DB columns — they are computed when you call the endpoints below.",
        "tenants_raw_only": "/tenants/",
        "tenants_with_scores": "/tenants/metrics",
        "tenants_ranked_by_combined_score": "/tenants/ranked",
        "tenants_scores_html": "/debug/tenants",
        "tenants_explanations_gemini_post": "/tenants/explanations",
    }
