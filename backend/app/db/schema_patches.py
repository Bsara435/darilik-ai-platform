"""Idempotent DDL for databases created before new columns existed.

SQLAlchemy ``create_all`` does not ALTER existing tables, so production DBs need
small patches (e.g. after adding ``PostVisitForm.contract_language``).
"""

from __future__ import annotations

import logging

from sqlalchemy import Engine, text

logger = logging.getLogger(__name__)


def apply_schema_patches(engine: Engine | None) -> None:
    if engine is None:
        return
    patches: list[str] = [
        # Legal Advisor — lease language (FR/EN/AR)
        """
        ALTER TABLE post_visit_forms
        ADD COLUMN IF NOT EXISTS contract_language VARCHAR(8) NOT NULL DEFAULT 'ar'
        """,
    ]
    try:
        with engine.begin() as conn:
            for raw in patches:
                conn.execute(text(raw.strip()))
    except Exception:
        logger.exception("Schema patch failed — you may need to run ALTER TABLE manually (see .env.example)")
