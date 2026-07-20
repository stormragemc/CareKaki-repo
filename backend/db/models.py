"""Relational models: persistent care profiles, cases, and case timelines —
the three tables called out in the technical brief as the production replacement
for CareKaki's in-memory dicts.
"""

from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .session import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CareProfile(Base):
    """A senior's longitudinal care profile, accreted from conversation extraction."""
    __tablename__ = "care_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Flexible bag for the extracted fields (living, mobility, conditions, …). JSON
    # is portable across Postgres (jsonb) and SQLite, keeping the ORM dialect-agnostic.
    fields: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    cases: Mapped[list["Case"]] = relationship(back_populates="profile", cascade="all, delete-orphan")


class Case(Base):
    """A coordinated care case (e.g. an ICCP handover) with a lifecycle status."""
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_ref: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    profile_id: Mapped[int | None] = mapped_column(ForeignKey("care_profiles.id"), nullable=True)
    patient_name: Mapped[str] = mapped_column(String(128))
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    issue: Mapped[str] = mapped_column(Text, default="")
    risk: Mapped[str] = mapped_column(String(16), default="High")
    status: Mapped[str] = mapped_column(String(24), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    profile: Mapped["CareProfile | None"] = relationship(back_populates="cases")
    events: Mapped[list["TimelineEvent"]] = relationship(
        back_populates="case", cascade="all, delete-orphan", order_by="TimelineEvent.created_at"
    )


class TimelineEvent(Base):
    """An append-only audit event on a case (coordinator actions, system steps)."""
    __tablename__ = "timeline_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    actor: Mapped[str] = mapped_column(String(32), default="system")  # system|bot|user
    text: Mapped[str] = mapped_column(Text)
    tone: Mapped[str] = mapped_column(String(16), default="default")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    case: Mapped["Case"] = relationship(back_populates="events")
