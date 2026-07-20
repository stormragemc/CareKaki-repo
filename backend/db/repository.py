"""Repository functions — the only place the app touches the ORM.

Every function is a no-op-safe wrapper: when the DB is disabled it returns a
sensible empty/echo value so call sites don't need to branch on DB_ENABLED.
"""

from sqlalchemy import select

from .session import DB_ENABLED, get_session
from .models import CareProfile, Case, TimelineEvent


# ── Care profiles ────────────────────────────────────────────────────────────

def upsert_profile(external_id: str, updates: dict) -> dict | None:
    """Merge extracted fields into a senior's longitudinal profile."""
    if not DB_ENABLED:
        return None
    known = {"name", "age"}
    with get_session() as s:
        profile = s.scalar(select(CareProfile).where(CareProfile.external_id == external_id))
        if profile is None:
            profile = CareProfile(external_id=external_id, fields={})
            s.add(profile)
        merged = dict(profile.fields or {})
        for k, v in (updates or {}).items():
            if v in (None, "", []):
                continue
            if k == "name":
                profile.name = str(v)
            elif k == "age":
                try:
                    profile.age = int(v)
                except (TypeError, ValueError):
                    pass
            else:
                merged[k] = v
        profile.fields = merged
        s.flush()
        return _profile_to_dict(profile)


def get_profile(external_id: str) -> dict | None:
    if not DB_ENABLED:
        return None
    with get_session() as s:
        profile = s.scalar(select(CareProfile).where(CareProfile.external_id == external_id))
        return _profile_to_dict(profile) if profile else None


# ── Cases + timeline ─────────────────────────────────────────────────────────

def create_case(case_ref: str, patient_name: str, age: int | None, issue: str,
                risk: str = "High", profile_external_id: str | None = None) -> dict | None:
    if not DB_ENABLED:
        return None
    with get_session() as s:
        profile_id = None
        if profile_external_id:
            p = s.scalar(select(CareProfile).where(CareProfile.external_id == profile_external_id))
            profile_id = p.id if p else None
        case = Case(
            case_ref=case_ref, patient_name=patient_name, age=age, issue=issue,
            risk=risk, status="pending", profile_id=profile_id,
        )
        s.add(case)
        s.flush()
        return _case_to_dict(case)


def add_event(case_ref: str, actor: str, text: str, tone: str = "default") -> None:
    if not DB_ENABLED:
        return
    with get_session() as s:
        case = s.scalar(select(Case).where(Case.case_ref == case_ref))
        if case is None:
            return
        s.add(TimelineEvent(case_id=case.id, actor=actor, text=text, tone=tone))


def set_case_status(case_ref: str, status: str) -> None:
    if not DB_ENABLED:
        return
    with get_session() as s:
        case = s.scalar(select(Case).where(Case.case_ref == case_ref))
        if case:
            case.status = status


def list_cases(limit: int = 50) -> list[dict]:
    if not DB_ENABLED:
        return []
    with get_session() as s:
        cases = s.scalars(select(Case).order_by(Case.created_at.desc()).limit(limit)).all()
        return [_case_to_dict(c, include_events=True) for c in cases]


# ── Serializers ──────────────────────────────────────────────────────────────

def _profile_to_dict(p: CareProfile) -> dict:
    return {
        "external_id": p.external_id,
        "name": p.name,
        "age": p.age,
        "fields": p.fields or {},
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _case_to_dict(c: Case, include_events: bool = False) -> dict:
    d = {
        "case_ref": c.case_ref,
        "patient_name": c.patient_name,
        "age": c.age,
        "issue": c.issue,
        "risk": c.risk,
        "status": c.status,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }
    if include_events:
        d["events"] = [
            {"actor": e.actor, "text": e.text, "tone": e.tone,
             "created_at": e.created_at.isoformat() if e.created_at else None}
            for e in c.events
        ]
    return d
