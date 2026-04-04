"""Legal Advisor — post-visit forms, conflict resolutions, generated contracts."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.tenant import Tenant


class PostVisitForm(Base):
    __tablename__ = "post_visit_forms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visit_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    landlord_id: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    property_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    property_address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    agreed_rent: Mapped[float] = mapped_column(Float, nullable=False)
    agreed_deposit: Mapped[str] = mapped_column(String(40), nullable=False)
    agreed_move_in: Mapped[date] = mapped_column(Date, nullable=False)
    agreed_duration: Mapped[str] = mapped_column(String(40), nullable=False)
    agreed_payment_method: Mapped[str] = mapped_column(String(60), nullable=False)
    special_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    landlord_concerns: Mapped[str | None] = mapped_column(Text, nullable=True)
    contract_language: Mapped[str] = mapped_column(String(8), nullable=False, default="ar")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    tenant: Mapped["Tenant"] = relationship("Tenant", lazy="joined")
    conflicts: Mapped[list["ConflictResolution"]] = relationship(
        "ConflictResolution",
        back_populates="post_visit",
        cascade="all, delete-orphan",
    )
    contracts: Mapped[list["LegalContract"]] = relationship(
        "LegalContract",
        back_populates="post_visit",
        cascade="all, delete-orphan",
    )


class ConflictResolution(Base):
    __tablename__ = "conflict_resolutions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visit_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("post_visit_forms.id", ondelete="CASCADE"),
        nullable=False,
    )
    field: Mapped[str] = mapped_column(String(120), nullable=False)
    landlord_position: Mapped[str] = mapped_column(Text, nullable=False)
    tenant_position: Mapped[str] = mapped_column(Text, nullable=False)
    legal_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    mediation_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    agreed_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    post_visit: Mapped["PostVisitForm"] = relationship("PostVisitForm", back_populates="conflicts")


class LegalContract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visit_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("post_visit_forms.id", ondelete="CASCADE"),
        nullable=False,
    )
    landlord_id: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    property_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    contract_text: Mapped[str] = mapped_column(Text, nullable=False)
    contract_html: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="draft")
    signed_copy_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    post_visit: Mapped["PostVisitForm"] = relationship(
        "PostVisitForm",
        back_populates="contracts",
    )
