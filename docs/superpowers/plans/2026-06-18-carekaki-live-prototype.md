# CareKaki Live Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static CareKaki mock into a live, stage-reliable, cloud-native demo (web + agent + guardian) running on a local Kubernetes (kind) cluster for the Dell InnovateDash final on 23 Jun 2026.

**Architecture:** Three real containers behind one gateway. `web` (Next.js 16 BFF + UI) proxies to `agent` (FastAPI brain: 5 routers + session store + hybrid Claude/scripted engine), which calls `guardian` (FastAPI Responsible-AI service) on the hot path. Same response schema in live and scripted modes so the UI is identical; scripted mode is built first as the stage safety net, live Claude layered on top. Demo runs live on a kind cluster; `docker-compose` is the dev loop.

**Tech Stack:** Next.js 16 / React 19 / Tailwind v4 (existing), FastAPI / Python 3.13 / Pydantic v2, Anthropic SDK (`claude-sonnet-4-6`), pytest + httpx, Docker, kind + kubectl.

**Source spec:** `docs/superpowers/specs/2026-06-03-carekaki-prototype-design.md`
**Review folded in:** `docs/superpowers/specs/2026-06-03-carekaki-prototype-review.md`
**Decisions (18 Jun):** Full spec scope · real kind cluster · persona switch built last · stage-reliability fixes baked in (single Claude call, ~3s timeout + pre-warm, invisible fallback, `?mode=scripted` no-restart flip, demo runbook, E2E rehearsal test).

---

## File structure

### `agent/` service (FastAPI brain)
- `agent/app/main.py` — app, CORS, router mounts, `/health`, model pre-warm on startup
- `agent/app/config.py` — env config (`ANTHROPIC_API_KEY`, `DEMO_MODE`, `CLAUDE_TIMEOUT_SECONDS`, `GUARDIAN_URL`)
- `agent/app/schemas.py` — Pydantic models mirroring `lib/types.ts` + request/response/SSE payloads
- `agent/app/session.py` — in-memory session store keyed by `session_id`
- `agent/app/engine/scripted.py` — per-persona deterministic fixtures (Mdm Tan, Mr Lim) — built first
- `agent/app/engine/claude_client.py` — Anthropic SDK wrapper; single tool call → `{assistant_text, profile_patch}`
- `agent/app/engine/hybrid.py` — selects live vs scripted per request; invisible fallback
- `agent/app/engine/pathway.py` — pathway reasoner (live + scripted), why-tags traced to profile facts
- `agent/app/engine/autopilot.py` — autopilot service derivation + status progression schedule
- `agent/app/guardian_client.py` — calls guardian; fail-open with logged warning
- `agent/app/routers/{conversation,profile,pathway,autopilot,handover,session}.py`
- `agent/requirements.txt`, `agent/Dockerfile`, `agent/tests/...`

### `guardian/` service (Responsible-AI)
- `guardian/app/main.py` — app, `/health`, `/check` endpoint
- `guardian/app/schemas.py`
- `guardian/app/pdpa.py` — NRIC/phone/email redaction
- `guardian/app/medical.py` — medical-advice classifier
- `guardian/app/provenance.py` — traceability attach/verify
- `guardian/app/decision_log.py` — structured decision log (bias-monitoring demonstrative)
- `guardian/requirements.txt`, `guardian/Dockerfile`, `guardian/tests/...`

### `web/` (existing Next.js — modify in place)
- `app/api/session/route.ts` — create/seed session, set cookie
- `app/api/conversation/route.ts` — SSE proxy to agent
- `app/api/pathway/route.ts`, `app/api/handover/route.ts` — JSON proxy
- `app/api/autopilot/route.ts` — SSE proxy
- `hooks/useChatState.ts` — replace mock with SSE client (preserve return shape)
- `app/(main)/pathway/page.tsx`, `app/autopilot/page.tsx`, `components/autopilot/AutopilotDashboard.tsx` — live data
- `components/chat/ChatPanel.tsx` (or sub-header) — persona switch + scripted-mode indicator
- `lib/api.ts` — typed fetch helpers + `?mode=` passthrough

### Infra (repo root)
- `docker-compose.yml`, `.env.example`, `Makefile`
- `web/Dockerfile`
- `k8s/{namespace,web,agent,guardian,ingress}.yaml`, `k8s/kind-config.yaml`
- `tests/e2e/demo-path.spec.ts` (or pytest httpx E2E) — the rehearsal test

---

## Phase 0 — Repo prep & contracts

### Task 0.1: Pin shared types as the contract source

**Files:**
- Modify: `lib/types.ts` (add session/handover/SSE event types)
- Create: `docs/superpowers/plans/contracts.md` (human-readable mirror for the Python side)

- [ ] **Step 1: Extend `lib/types.ts`** — append these exported types after the existing `AutopilotService` block:

```ts
// ── Session ───────────────────────────────────────────────────────────────────
export type PersonaId = "mdm_tan" | "mr_lim";

export interface SessionInfo {
  sessionId: string;
  persona: PersonaId;
  mode: "live" | "scripted";
}

// ── Handover (Care Brief) ──────────────────────────────────────────────────────
export interface CareBrief {
  client: CareProfile;
  summary: string;
  priorityActions: string[];
  coordinator: string;          // e.g. "Aunty Mei (least-loaded ICCP officer)"
  provider: string;             // "Care Corner ICCP"
  generatedAt: string;          // ISO timestamp
}

// ── SSE events (conversation stream) ───────────────────────────────────────────
export type ConversationEvent =
  | { type: "token"; text: string }
  | { type: "profile_patch"; patch: Partial<CareProfile> }
  | { type: "done"; messageId: string }
  | { type: "error"; message: string };

// ── SSE events (autopilot stream) ──────────────────────────────────────────────
export type AutopilotEvent =
  | { type: "service_update"; service: AutopilotService }
  | { type: "done" };
```

- [ ] **Step 2: Write `docs/superpowers/plans/contracts.md`** documenting every field of `CareProfile`, `PathwayColumnData`, `AutopilotService`, `CareBrief`, `SessionInfo`, and both SSE event unions, with a note: "Python Pydantic models in `agent/app/schemas.py` and `guardian/app/schemas.py` MUST serialize to exactly these shapes (camelCase via field aliases)." Include the literal allowed values for `ServiceStatus` (`submitted|scheduled|active|routed|pending|passing`) and `PathwayColorScheme` (`orange|blue|amber|teal`).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts docs/superpowers/plans/contracts.md
git commit -m "feat(contracts): extend shared types for session, handover, SSE events"
```

---

## Phase 1 — Guardian service (built first; agent depends on it)

> Rationale: agent calls guardian on the hot path, so guardian's contract must exist first. It is stateless and small.

### Task 1.1: Guardian project skeleton

**Files:**
- Create: `guardian/requirements.txt`, `guardian/app/__init__.py`, `guardian/app/main.py`, `guardian/tests/__init__.py`, `guardian/tests/conftest.py`

- [ ] **Step 1: `guardian/requirements.txt`**

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.4
pytest==8.3.4
httpx==0.28.1
```

- [ ] **Step 2: `guardian/app/main.py`** (health only for now)

```python
from fastapi import FastAPI

app = FastAPI(title="CareKaki Guardian")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "guardian"}
```

- [ ] **Step 3: `guardian/tests/conftest.py`**

```python
import pytest
from fastapi.testclient import TestClient
from guardian.app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
```

- [ ] **Step 4: `guardian/tests/test_health.py`** (failing test first)

```python
def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "service": "guardian"}
```

- [ ] **Step 5: Run it** — `cd /Users/anandatriharismaroso/Documents/GitHub/CareKaki-repo && python -m pytest guardian/tests/test_health.py -v` → Expected: PASS (skeleton already returns this; if import path fails, add repo root to `PYTHONPATH` via `guardian/pytest.ini` with `pythonpath = .`).

- [ ] **Step 6: Commit** — `git add guardian && git commit -m "feat(guardian): service skeleton + health check"`

### Task 1.2: PDPA redaction

**Files:** Create `guardian/app/pdpa.py`, `guardian/tests/test_pdpa.py`

- [ ] **Step 1: Failing test `guardian/tests/test_pdpa.py`**

```python
from guardian.app.pdpa import redact_pii


def test_redacts_nric():
    assert redact_pii("Her NRIC is S1234567D today") == "Her NRIC is [REDACTED-NRIC] today"


def test_redacts_sg_phone():
    assert redact_pii("call 91234567") == "call [REDACTED-PHONE]"


def test_redacts_email():
    assert redact_pii("mail wei@x.com") == "mail [REDACTED-EMAIL]"


def test_leaves_benign_text():
    assert redact_pii("She uses a walker") == "She uses a walker"
```

- [ ] **Step 2: Run → FAIL** (`No module named guardian.app.pdpa`).

- [ ] **Step 3: Implement `guardian/app/pdpa.py`**

```python
import re

_NRIC = re.compile(r"\b[STFG]\d{7}[A-Z]\b")
_PHONE = re.compile(r"\b[89]\d{7}\b")
_EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")


def redact_pii(text: str) -> str:
    text = _EMAIL.sub("[REDACTED-EMAIL]", text)
    text = _NRIC.sub("[REDACTED-NRIC]", text)
    text = _PHONE.sub("[REDACTED-PHONE]", text)
    return text
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** — `git commit -am "feat(guardian): PDPA pii redaction"`

### Task 1.3: Medical-advice classifier

**Files:** Create `guardian/app/medical.py`, `guardian/tests/test_medical.py`

- [ ] **Step 1: Failing test**

```python
from guardian.app.medical import is_medical_advice


def test_flags_dosage_question():
    assert is_medical_advice("How much amlodipine should she take?") is True


def test_flags_diagnosis():
    assert is_medical_advice("Does she have a fracture or just a sprain?") is True


def test_allows_service_navigation():
    assert is_medical_advice("Which grant can I apply for?") is False
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `guardian/app/medical.py`** (keyword + pattern heuristic; honest "Full" depth for a demo)

```python
import re

_PATTERNS = [
    r"\b(dose|dosage|how much .* (take|mg)|mg\b)",
    r"\b(diagnos|prescrib|symptom|treat(ment)?|cure)\b",
    r"\b(fracture|sprain|infection|side effect)\b.*\?",
    r"\b(should (she|he|i) take|stop taking|increase the)\b",
]
_RX = [re.compile(p, re.IGNORECASE) for p in _PATTERNS]


def is_medical_advice(text: str) -> bool:
    return any(rx.search(text) for rx in _RX)
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** — `git commit -am "feat(guardian): medical-advice classifier"`

### Task 1.4: Provenance + decision log

**Files:** Create `guardian/app/provenance.py`, `guardian/app/decision_log.py`, tests.

- [ ] **Step 1: Failing test `guardian/tests/test_provenance.py`**

```python
from guardian.app.provenance import verify_provenance


def test_accepts_traced_item():
    profile = {"living": "Alone, post-discharge"}
    ok, missing = verify_provenance(
        items=[{"text": "Home safety walk-through", "why": "lives alone post-discharge"}],
        profile=profile,
    )
    assert ok is True
    assert missing == []


def test_flags_untraced_item():
    ok, missing = verify_provenance(
        items=[{"text": "Random service", "why": ""}],
        profile={"living": "Alone"},
    )
    assert ok is False
    assert missing == ["Random service"]
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `guardian/app/provenance.py`**

```python
def verify_provenance(items: list[dict], profile: dict) -> tuple[bool, list[str]]:
    """Every recommendation must carry a non-empty `why`. Returns (ok, untraced_texts)."""
    missing = [it.get("text", "?") for it in items if not (it.get("why") or "").strip()]
    return (len(missing) == 0, missing)
```

- [ ] **Step 4: Implement `guardian/app/decision_log.py`** (in-memory; demonstrative bias-monitoring)

```python
from datetime import datetime, timezone

_LOG: list[dict] = []


def record(decision_type: str, payload: dict) -> None:
    _LOG.append({"at": datetime.now(timezone.utc).isoformat(), "type": decision_type, "payload": payload})


def entries() -> list[dict]:
    return list(_LOG)
```

- [ ] **Step 5: Run provenance test → PASS. Commit** — `git commit -am "feat(guardian): provenance verification + decision log"`

### Task 1.5: `/check` endpoint wiring the six principles

**Files:** Create `guardian/app/schemas.py`; modify `guardian/app/main.py`; create `guardian/tests/test_check.py`

- [ ] **Step 1: `guardian/app/schemas.py`**

```python
from pydantic import BaseModel, Field


class CheckRequest(BaseModel):
    kind: str  # "assistant_text" | "pathway" | "autopilot_action"
    text: str | None = None
    items: list[dict] = Field(default_factory=list)
    profile: dict = Field(default_factory=dict)


class CheckResponse(BaseModel):
    ok: bool
    redacted_text: str | None = None
    requires_human: bool = False
    flags: list[str] = Field(default_factory=list)
    untraced: list[str] = Field(default_factory=list)
```

- [ ] **Step 2: Failing test `guardian/tests/test_check.py`**

```python
def test_check_redacts_and_passes_benign(client):
    r = client.post("/check", json={"kind": "assistant_text", "text": "Call 91234567 about the grant"})
    body = r.json()
    assert body["ok"] is True
    assert body["redacted_text"] == "Call [REDACTED-PHONE] about the grant"
    assert "medical_advice" not in body["flags"]


def test_check_flags_medical_advice_requires_human(client):
    r = client.post("/check", json={"kind": "assistant_text", "text": "What dose of amlodipine?"})
    body = r.json()
    assert body["requires_human"] is True
    assert "medical_advice" in body["flags"]


def test_check_pathway_flags_untraced(client):
    r = client.post("/check", json={
        "kind": "pathway",
        "items": [{"text": "Mystery service", "why": ""}],
        "profile": {"living": "Alone"},
    })
    assert r.json()["untraced"] == ["Mystery service"]
```

- [ ] **Step 3: Run → FAIL.**

- [ ] **Step 4: Implement `/check` in `guardian/app/main.py`**

```python
from fastapi import FastAPI
from guardian.app.schemas import CheckRequest, CheckResponse
from guardian.app.pdpa import redact_pii
from guardian.app.medical import is_medical_advice
from guardian.app.provenance import verify_provenance
from guardian.app import decision_log

app = FastAPI(title="CareKaki Guardian")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "guardian"}


@app.post("/check", response_model=CheckResponse)
def check(req: CheckRequest) -> CheckResponse:
    flags: list[str] = []
    requires_human = False
    redacted = None
    untraced: list[str] = []

    if req.text is not None:
        redacted = redact_pii(req.text)
        if is_medical_advice(req.text):
            flags.append("medical_advice")
            requires_human = True

    if req.kind == "pathway" and req.items:
        ok, untraced = verify_provenance(req.items, req.profile)
        if not ok:
            flags.append("untraced_recommendation")

    if req.kind == "autopilot_action":
        requires_human = True  # risky outward actions always gated (Principle 3)
        flags.append("human_gate")

    resp = CheckResponse(
        ok=not flags or flags == ["human_gate"],
        redacted_text=redacted,
        requires_human=requires_human,
        flags=flags,
        untraced=untraced,
    )
    decision_log.record(req.kind, {"flags": flags, "requires_human": requires_human})
    return resp
```

- [ ] **Step 5: Run → PASS. Commit** — `git commit -am "feat(guardian): /check endpoint enforcing six principles"`

### Task 1.6: Guardian Dockerfile

**Files:** Create `guardian/Dockerfile`, `guardian/.dockerignore`

- [ ] **Step 1: `guardian/Dockerfile`**

```dockerfile
FROM python:3.13-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

- [ ] **Step 2: `guardian/.dockerignore`** — `__pycache__/`, `tests/`, `*.pyc`

- [ ] **Step 3: Build to verify** — `docker build -t carekaki-guardian ./guardian` → Expected: success.

- [ ] **Step 4: Commit** — `git add guardian/Dockerfile guardian/.dockerignore && git commit -m "feat(guardian): containerize"`

> Note: tests import `guardian.app.*` (repo-root-relative) but the image copies `app` to `/srv/app` and runs `app.main:app`. Keep both import styles working: add `guardian/pytest.ini` with `pythonpath = .` and ensure `app/__init__.py` exists.

---

## Phase 2 — Agent skeleton, schemas, session

### Task 2.1: Agent project skeleton + config + health

**Files:** Create `agent/requirements.txt`, `agent/app/__init__.py`, `agent/app/config.py`, `agent/app/main.py`, `agent/pytest.ini`, `agent/tests/conftest.py`, `agent/tests/test_health.py`

- [ ] **Step 1: `agent/requirements.txt`**

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.4
anthropic==0.42.0
httpx==0.28.1
pytest==8.3.4
pytest-asyncio==0.25.0
```

- [ ] **Step 2: `agent/app/config.py`**

```python
import os


class Config:
    ANTHROPIC_API_KEY: str | None = os.getenv("ANTHROPIC_API_KEY")
    DEMO_MODE: str = os.getenv("DEMO_MODE", "live")          # "live" | "scripted"
    CLAUDE_TIMEOUT_SECONDS: float = float(os.getenv("CLAUDE_TIMEOUT_SECONDS", "3"))
    GUARDIAN_URL: str = os.getenv("GUARDIAN_URL", "http://localhost:8001")
    MODEL: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")


config = Config()
```

- [ ] **Step 3: `agent/app/main.py`** (health + startup pre-warm hook placeholder)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CareKaki Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "agent"}
```

- [ ] **Step 4: `agent/pytest.ini`** → `[pytest]\npythonpath = .\nasyncio_mode = auto`

- [ ] **Step 5: `agent/tests/conftest.py`**

```python
import pytest
from fastapi.testclient import TestClient
from agent.app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
```

- [ ] **Step 6: `agent/tests/test_health.py`** + run → PASS.

```python
def test_health_ok(client):
    assert client.get("/health").json()["service"] == "agent"
```

- [ ] **Step 7: Commit** — `git add agent && git commit -m "feat(agent): skeleton, config, health"`

### Task 2.2: Schemas mirroring the TS contract

**Files:** Create `agent/app/schemas.py`, `agent/tests/test_schemas.py`

- [ ] **Step 1: Failing test `agent/tests/test_schemas.py`** (assert camelCase serialization matches the TS contract)

```python
from agent.app.schemas import CareProfile, PathwayColumn, AutopilotService


def test_profile_serializes_camelcase():
    p = CareProfile(name="Mdm Tan", age=78, financial_tier="full subsidy")
    dumped = p.model_dump(by_alias=True)
    assert dumped["financialTier"] == "full subsidy"
    assert dumped["recentEvent"] == ""  # default empty


def test_pathway_column_fields():
    c = PathwayColumn(id="this-week", timeframe="THIS WEEK", title="Get home safely",
                      color_scheme="orange", items=["x"], why_this_for_you="lives alone")
    assert c.model_dump(by_alias=True)["whyThisForYou"] == "lives alone"


def test_service_status_validated():
    s = AutopilotService(id="hcg", icon="$", icon_color="bg-brand-orange", name="HCG",
                         provider="AIC", description="d", status="submitted",
                         status_label="Submitted", is_running=True)
    assert s.model_dump(by_alias=True)["isRunning"] is True
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/schemas.py`**

```python
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

ServiceStatus = Literal["submitted", "scheduled", "active", "routed", "pending", "passing"]
ColorScheme = Literal["orange", "blue", "amber", "teal"]
PersonaId = Literal["mdm_tan", "mr_lim"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CareProfile(CamelModel):
    name: str = ""
    age: int = 0
    living: str = ""
    mobility: str = ""
    conditions: str = ""
    caregiver: str = ""
    financial_tier: str = ""
    recent_event: str = ""


class Message(CamelModel):
    id: str
    role: Literal["assistant", "user"]
    content: str


class PathwayColumn(CamelModel):
    id: str
    timeframe: str
    title: str
    color_scheme: ColorScheme
    items: list[str]
    why_this_for_you: str


class AutopilotService(CamelModel):
    id: str
    icon: str
    icon_color: str
    name: str
    provider: str
    description: str
    status: ServiceStatus
    status_label: str
    is_running: bool


class CareBrief(CamelModel):
    client: CareProfile
    summary: str
    priority_actions: list[str]
    coordinator: str
    provider: str
    generated_at: str


# Request bodies
class ConversationRequest(CamelModel):
    session_id: str
    message: str


class SessionRequest(CamelModel):
    persona: PersonaId = "mdm_tan"
    mode: Literal["live", "scripted"] | None = None
```

- [ ] **Step 4: Run → PASS. Commit** — `git commit -am "feat(agent): pydantic schemas mirroring TS contract"`

### Task 2.3: In-memory session store

**Files:** Create `agent/app/session.py`, `agent/tests/test_session.py`

- [ ] **Step 1: Failing test**

```python
from agent.app.session import store
from agent.app.schemas import CareProfile


def test_create_and_get():
    sid = store.create(persona="mdm_tan")
    s = store.get(sid)
    assert s.persona == "mdm_tan"
    assert isinstance(s.profile, CareProfile)


def test_patch_profile_merges():
    sid = store.create(persona="mdm_tan")
    store.patch_profile(sid, {"living": "Alone"})
    assert store.get(sid).profile.living == "Alone"


def test_append_message():
    sid = store.create(persona="mr_lim")
    store.append_message(sid, role="user", content="hi")
    assert store.get(sid).history[-1].content == "hi"
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/session.py`**

```python
import uuid
from dataclasses import dataclass, field
from agent.app.schemas import CareProfile, Message, PersonaId


@dataclass
class Session:
    session_id: str
    persona: PersonaId
    profile: CareProfile = field(default_factory=CareProfile)
    history: list[Message] = field(default_factory=list)
    turn: int = 0


class SessionStore:
    def __init__(self) -> None:
        self._s: dict[str, Session] = {}

    def create(self, persona: PersonaId = "mdm_tan") -> str:
        sid = uuid.uuid4().hex
        self._s[sid] = Session(session_id=sid, persona=persona)
        return sid

    def get(self, sid: str) -> Session:
        return self._s[sid]

    def patch_profile(self, sid: str, patch: dict) -> None:
        s = self._s[sid]
        s.profile = s.profile.model_copy(update={k: v for k, v in patch.items() if v not in (None, "")})

    def append_message(self, sid: str, role: str, content: str) -> Message:
        s = self._s[sid]
        m = Message(id=f"{sid}-{len(s.history)}", role=role, content=content)
        s.history.append(m)
        return m


store = SessionStore()
```

> Note: `patch_profile` keys are snake_case pydantic field names. The Claude tool and scripted fixtures must emit snake_case keys (`financial_tier`, not `financialTier`) for patches; camelCase is only the serialization boundary.

- [ ] **Step 4: Run → PASS. Commit** — `git commit -am "feat(agent): in-memory session store"`

---

## Phase 3 — Scripted engine first (the safety net)

### Task 3.1: Per-persona scripted fixtures

**Files:** Create `agent/app/engine/__init__.py`, `agent/app/engine/scripted.py`, `agent/tests/test_scripted.py`

- [ ] **Step 1: Failing test `agent/tests/test_scripted.py`**

```python
from agent.app.engine.scripted import scripted_turn, scripted_pathway, PERSONAS


def test_two_personas_exist():
    assert set(PERSONAS) == {"mdm_tan", "mr_lim"}


def test_turn_returns_text_and_patch():
    out = scripted_turn(persona="mdm_tan", turn=0, message="My mum had a fall")
    assert out["assistant_text"]
    assert isinstance(out["profile_patch"], dict)


def test_personas_diverge_in_pathway():
    tan = scripted_pathway("mdm_tan")
    lim = scripted_pathway("mr_lim")
    assert [c.title for c in tan] != [c.title for c in lim]
    for col in tan + lim:
        assert col.why_this_for_you.strip()  # every column traced
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/engine/scripted.py`** — port Mdm Tan from `lib/mock-data.ts`, add Mr Lim. Each persona has an ordered list of `(assistant_text, profile_patch)` turns and a pathway. (Full code below; keep four turns per persona so the demo's chat beats land.)

```python
from agent.app.schemas import PathwayColumn

PERSONAS = ("mdm_tan", "mr_lim")

_TURNS = {
    "mdm_tan": [
        {"assistant_text": "Okay, that sounds stressful. Is she steady on her feet now, and is anyone home with her this week?",
         "profile_patch": {"name": "Mdm Tan", "age": 78, "recent_event": "Discharged today, SGH", "living": "Alone, 3rd-floor flat with lift"}},
        {"assistant_text": "Got it — a walker and you're working full-time. I'll start lining up home support. Any conditions I should plan around?",
         "profile_patch": {"mobility": "Walker after fall", "caregiver": "Daughter, full-time + 2 kids"}},
        {"assistant_text": "Thanks. Mild hypertension and the recent fracture noted. I'm building her plan now.",
         "profile_patch": {"conditions": "Mild hypertension, recent fracture", "financial_tier": "Per-capita ≤ $1,500 · full subsidy"}},
        {"assistant_text": "Her plan is ready — open the care plan to see what I've lined up, and I can launch Autopilot when you're set.",
         "profile_patch": {}},
    ],
    "mr_lim": [
        {"assistant_text": "I hear you. You're overseas and he's on his own after the fall — let's make sure he's not alone with this. Is he managing day to day?",
         "profile_patch": {"name": "Mr Lim", "age": 72, "recent_event": "Discharged this week", "living": "Alone, children in London"}},
        {"assistant_text": "Understood — limited mobility and no family in the room. Loneliness and check-ins matter as much as the medical side here.",
         "profile_patch": {"mobility": "Unsteady after fall", "caregiver": "Children overseas (London)"}},
        {"assistant_text": "Noted on the finances — he likely qualifies for Silver Support. I'm shaping a plan around connection and regular contact.",
         "profile_patch": {"conditions": "Post-fall, lives alone", "financial_tier": "Lower-income · Silver Support eligible"}},
        {"assistant_text": "His plan is ready, with weekly check-ins and an Active Ageing Centre link. Open the care plan to review.",
         "profile_patch": {}},
    ],
}

_PATHWAYS = {
    "mdm_tan": [
        PathwayColumn(id="this-week", timeframe="THIS WEEK", title="Get home safely", color_scheme="orange",
                      items=["Home safety walk-through", "Walker + grab-bar fitting", "Caregiver basics: falls"],
                      why_this_for_you="Lives alone post-discharge"),
        PathwayColumn(id="weeks-2-8", timeframe="WEEKS 2–8", title="Ongoing care", color_scheme="blue",
                      items=["Home Nursing Foundation visits", "Physio at SACH polyclinic", "Medication review"],
                      why_this_for_you="Mobility limited; subsidy eligible"),
        PathwayColumn(id="apply-now", timeframe="APPLY NOW", title="Financial support", color_scheme="amber",
                      items=["Home Caregiving Grant", "MediFund top-up", "CHAS Blue review"],
                      why_this_for_you="Per-capita income within tier"),
        PathwayColumn(id="single-point", timeframe="SINGLE POINT", title="One coordinator", color_scheme="teal",
                      items=["Care Corner ICCP case officer", "Family WhatsApp loop", "Monthly check-in"],
                      why_this_for_you="Complex case + working caregiver"),
    ],
    "mr_lim": [
        PathwayColumn(id="this-week", timeframe="THIS WEEK", title="Safe & not alone", color_scheme="orange",
                      items=["Home safety walk-through", "Daily tele-check-in setup", "Emergency alert pendant"],
                      why_this_for_you="Lives alone, no family in the room"),
        PathwayColumn(id="weeks-2-8", timeframe="WEEKS 2–8", title="Stay connected", color_scheme="blue",
                      items=["Active Ageing Centre enrolment", "Weekly befriender visits", "Physio review"],
                      why_this_for_you="Loneliness risk; children overseas"),
        PathwayColumn(id="apply-now", timeframe="APPLY NOW", title="Financial support", color_scheme="amber",
                      items=["Silver Support Scheme", "CHAS review", "ComCare check"],
                      why_this_for_you="Lower-income, Silver Support eligible"),
        PathwayColumn(id="single-point", timeframe="SINGLE POINT", title="One coordinator", color_scheme="teal",
                      items=["Care Corner ICCP case officer", "Family WhatsApp to London", "Weekly check-in"],
                      why_this_for_you="Lives alone; overseas family needs the loop"),
    ],
}


def scripted_turn(persona: str, turn: int, message: str) -> dict:
    turns = _TURNS[persona]
    return turns[min(turn, len(turns) - 1)]


def scripted_pathway(persona: str) -> list[PathwayColumn]:
    return _PATHWAYS[persona]
```

- [ ] **Step 4: Run → PASS. Commit** — `git commit -am "feat(agent): scripted engine fixtures for both personas"`

### Task 3.2: Scripted autopilot services + progression

**Files:** Create `agent/app/engine/autopilot.py`, `agent/tests/test_autopilot.py`

- [ ] **Step 1: Failing test**

```python
from agent.app.engine.autopilot import initial_services, progression_plan


def test_initial_services_start_pending(monkeypatch):
    svcs = initial_services("mdm_tan")
    assert len(svcs) == 6
    assert all(s.status == "pending" for s in svcs)
    assert any("Care Corner" in s.provider or s.id == "coordinator" for s in svcs)


def test_progression_drives_each_service_forward():
    plan = progression_plan("mdm_tan")
    ids = {step["id"] for step in plan}
    assert "coordinator" in ids
    assert all("status" in step and "statusLabel" in step for step in plan)
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/engine/autopilot.py`** — six services per persona starting `pending`, plus an ordered progression list `[{id, delay_s, status, statusLabel}]` the SSE endpoint replays. Make the **coordinator (Care Corner ICCP)** card the visual hero (first to reach `routed`). Port icons/colors from `lib/mock-data.ts`. Mr Lim variant swaps "WhatsApp to Wei Ling" → "WhatsApp to daughter (London)" and adds a befriender/check-in service. (Write full per-persona dicts here, mirroring the six `AutopilotService` objects from mock-data with `status="pending"` initial.)

- [ ] **Step 4: Run → PASS. Commit** — `git commit -am "feat(agent): autopilot services + progression plan"`

---

## Phase 4 — Hybrid engine + Claude (single call)

### Task 4.1: Claude client — single tool call → text + patch

**Files:** Create `agent/app/engine/claude_client.py`, `agent/tests/test_claude_client.py`

- [ ] **Step 1: Failing test (mock the SDK; no network)** `agent/tests/test_claude_client.py`

```python
from unittest.mock import MagicMock
from agent.app.engine import claude_client


def test_parses_tool_output(monkeypatch):
    fake_tool = MagicMock(type="tool_use", name="update_conversation",
                          input={"assistant_text": "hi", "profile_patch": {"living": "Alone"}})
    fake_resp = MagicMock(content=[fake_tool])
    fake_client = MagicMock()
    fake_client.messages.create.return_value = fake_resp
    monkeypatch.setattr(claude_client, "_client", lambda: fake_client)

    out = claude_client.run_turn(history=[], message="m", profile={})
    assert out["assistant_text"] == "hi"
    assert out["profile_patch"]["living"] == "Alone"
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/engine/claude_client.py`** — one `messages.create` call with a single tool `update_conversation` whose JSON schema returns `{assistant_text: str, profile_patch: object}`; `tool_choice` forces that tool. Use the `agent/app/config.py` model + key. `_client()` lazily builds `anthropic.Anthropic(...)`.

```python
import anthropic
from agent.app.config import config

_TOOL = {
    "name": "update_conversation",
    "description": "Reply warmly to the caregiver and extract any new care-profile facts.",
    "input_schema": {
        "type": "object",
        "properties": {
            "assistant_text": {"type": "string"},
            "profile_patch": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"}, "age": {"type": "integer"},
                    "living": {"type": "string"}, "mobility": {"type": "string"},
                    "conditions": {"type": "string"}, "caregiver": {"type": "string"},
                    "financial_tier": {"type": "string"}, "recent_event": {"type": "string"},
                },
            },
        },
        "required": ["assistant_text", "profile_patch"],
    },
}

_SYSTEM = (
    "You are CareKaki, helping Singapore seniors/caregivers navigate community care. "
    "Be warm, concrete, never give medical advice. Extract care-profile facts as they appear."
)


def _client() -> "anthropic.Anthropic":
    return anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)


def run_turn(history: list[dict], message: str, profile: dict) -> dict:
    msgs = history + [{"role": "user", "content": message}]
    resp = _client().messages.create(
        model=config.MODEL, max_tokens=600, system=_SYSTEM,
        tools=[_TOOL], tool_choice={"type": "tool", "name": "update_conversation"},
        messages=msgs,
    )
    for block in resp.content:
        if getattr(block, "type", None) == "tool_use":
            return {"assistant_text": block.input["assistant_text"],
                    "profile_patch": block.input.get("profile_patch", {})}
    raise RuntimeError("no tool_use in response")
```

- [ ] **Step 4: Run → PASS. Commit** — `git commit -am "feat(agent): claude single-call client"`

### Task 4.2: Hybrid selector with invisible fallback

**Files:** Create `agent/app/engine/hybrid.py`, `agent/tests/test_hybrid.py`

- [ ] **Step 1: Failing test**

```python
from agent.app.engine import hybrid


def test_uses_scripted_when_no_key(monkeypatch):
    monkeypatch.setattr(hybrid.config, "ANTHROPIC_API_KEY", None)
    out = hybrid.turn(persona="mdm_tan", turn=0, history=[], message="hi", profile={}, mode="live")
    assert out["assistant_text"]  # came from scripted, no exception


def test_explicit_scripted_mode(monkeypatch):
    out = hybrid.turn(persona="mr_lim", turn=0, history=[], message="hi", profile={}, mode="scripted")
    assert out["source"] == "scripted"


def test_falls_back_on_claude_error(monkeypatch):
    monkeypatch.setattr(hybrid.config, "ANTHROPIC_API_KEY", "x")
    def boom(**kw): raise TimeoutError()
    monkeypatch.setattr(hybrid.claude_client, "run_turn", boom)
    out = hybrid.turn(persona="mdm_tan", turn=0, history=[], message="hi", profile={}, mode="live")
    assert out["source"] == "scripted"  # invisible fallback
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/engine/hybrid.py`**

```python
import concurrent.futures
from agent.app.config import config
from agent.app.engine import claude_client, scripted


def _use_live(mode: str) -> bool:
    if mode == "scripted" or config.DEMO_MODE == "scripted":
        return False
    return bool(config.ANTHROPIC_API_KEY)


def turn(persona: str, turn: int, history: list[dict], message: str, profile: dict, mode: str) -> dict:
    if _use_live(mode):
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                fut = ex.submit(claude_client.run_turn, history=history, message=message, profile=profile)
                out = fut.result(timeout=config.CLAUDE_TIMEOUT_SECONDS)
            return {**out, "source": "live"}
        except Exception:
            pass  # invisible fallback
    out = scripted.scripted_turn(persona=persona, turn=turn, message=message)
    return {**out, "source": "scripted"}
```

- [ ] **Step 4: Run → PASS. Commit** — `git commit -am "feat(agent): hybrid engine with invisible fallback"`

### Task 4.3: Pathway reasoner (live + scripted)

**Files:** Create `agent/app/engine/pathway.py`, `agent/tests/test_pathway.py`

- [ ] **Step 1: Failing test** — given a profile, returns 4 columns, each with non-empty `why_this_for_you`; scripted path used when no key.

```python
from agent.app.engine.pathway import build_pathway


def test_scripted_pathway_traced(monkeypatch):
    cols = build_pathway(persona="mdm_tan", profile={"living": "Alone"}, mode="scripted")
    assert len(cols) == 4
    assert all(c.why_this_for_you.strip() for c in cols)
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/engine/pathway.py`** — `build_pathway` mirrors the hybrid pattern: live mode calls Claude with a `build_pathway` tool (JSON schema: 4 columns, each `{id,timeframe,title,colorScheme,items[],whyThisForYou}` with `whyThisForYou` required and instructed to cite a profile fact); on no-key/error/`scripted` it returns `scripted.scripted_pathway(persona)`. Validate each column through the `PathwayColumn` schema; on parse failure, fall back to scripted.

- [ ] **Step 4: Run → PASS. Commit** — `git commit -am "feat(agent): pathway reasoner live+scripted"`

---

## Phase 5 — Agent routers + guardian on hot path

### Task 5.1: Guardian client (fail-open)

**Files:** Create `agent/app/guardian_client.py`, `agent/tests/test_guardian_client.py`

- [ ] **Step 1: Failing test** (mock httpx) — returns redacted text when guardian responds; returns input unchanged if guardian is down.

```python
from agent.app import guardian_client


def test_fail_open_when_guardian_down(monkeypatch):
    def boom(*a, **k): raise OSError()
    monkeypatch.setattr(guardian_client.httpx, "post", boom)
    out = guardian_client.check_text("call 91234567")
    assert out["redacted_text"] == "call 91234567"   # unchanged, fail-open
    assert out["ok"] is True
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/guardian_client.py`**

```python
import httpx
from agent.app.config import config


def _check(payload: dict) -> dict:
    try:
        r = httpx.post(f"{config.GUARDIAN_URL}/check", json=payload, timeout=2.0)
        r.raise_for_status()
        return r.json()
    except Exception:
        return {"ok": True, "redacted_text": payload.get("text"), "requires_human": False, "flags": [], "untraced": []}


def check_text(text: str) -> dict:
    return _check({"kind": "assistant_text", "text": text})


def check_pathway(items: list[dict], profile: dict) -> dict:
    return _check({"kind": "pathway", "items": items, "profile": profile})


def check_autopilot_action(text: str) -> dict:
    return _check({"kind": "autopilot_action", "text": text})
```

- [ ] **Step 4: Run → PASS. Commit** — `git commit -am "feat(agent): guardian client (fail-open)"`

### Task 5.2: Session router

**Files:** Create `agent/app/routers/__init__.py`, `agent/app/routers/session.py`; modify `agent/app/main.py`; create `agent/tests/test_session_router.py`

- [ ] **Step 1: Failing test**

```python
def test_create_session(client):
    r = client.post("/session", json={"persona": "mdm_tan"})
    body = r.json()
    assert body["persona"] == "mdm_tan"
    assert body["sessionId"]
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/routers/session.py`**

```python
from fastapi import APIRouter
from agent.app.schemas import SessionRequest
from agent.app.session import store

router = APIRouter()


@router.post("/session")
def create_session(req: SessionRequest) -> dict:
    sid = store.create(persona=req.persona)
    return {"sessionId": sid, "persona": req.persona, "mode": req.mode or "live"}
```

- [ ] **Step 4: Mount in `main.py`** — `from agent.app.routers import session as session_router` then `app.include_router(session_router.router)`.

- [ ] **Step 5: Run → PASS. Commit** — `git commit -am "feat(agent): session router"`

### Task 5.3: Conversation router (SSE) with guardian

**Files:** Create `agent/app/routers/conversation.py`; mount; create `agent/tests/test_conversation_router.py`

- [ ] **Step 1: Failing test** (scripted mode → deterministic SSE)

```python
def test_conversation_streams_tokens_and_patch(client):
    sid = client.post("/session", json={"persona": "mdm_tan"}).json()["sessionId"]
    with client.stream("POST", "/conversation?mode=scripted",
                       json={"sessionId": sid, "message": "My mum had a fall"}) as r:
        body = "".join(chunk for chunk in r.iter_text())
    assert "profile_patch" in body
    assert "token" in body
    assert "done" in body
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/routers/conversation.py`** — SSE generator: append user message; call `hybrid.turn(...)`; run assistant text through `guardian_client.check_text` (use `redacted_text`); emit `token` events word-by-word (chunked so the UI streams even in scripted mode), then a `profile_patch` event (after `store.patch_profile`), then `done`. Read `mode` from query param (`?mode=scripted`) for the no-restart flip.

```python
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from agent.app.schemas import ConversationRequest
from agent.app.session import store
from agent.app.engine import hybrid
from agent.app import guardian_client

router = APIRouter()


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


@router.post("/conversation")
async def conversation(req: ConversationRequest, request: Request) -> StreamingResponse:
    mode = request.query_params.get("mode", "live")
    s = store.get(req.session_id)
    store.append_message(req.session_id, "user", req.message)
    history = [{"role": m.role, "content": m.content} for m in s.history]
    out = hybrid.turn(persona=s.persona, turn=s.turn, history=history,
                      message=req.message, profile=s.profile.model_dump(), mode=mode)
    guarded = guardian_client.check_text(out["assistant_text"])
    text = guarded.get("redacted_text") or out["assistant_text"]
    patch = out["profile_patch"]

    def gen():
        for word in text.split(" "):
            yield _sse({"type": "token", "text": word + " "})
        store.patch_profile(req.session_id, patch)
        yield _sse({"type": "profile_patch", "patch": store.get(req.session_id).profile.model_dump(by_alias=True)})
        msg = store.append_message(req.session_id, "assistant", text)
        s.turn += 1
        yield _sse({"type": "done", "messageId": msg.id})

    return StreamingResponse(gen(), media_type="text/event-stream")
```

- [ ] **Step 4: Mount + run → PASS. Commit** — `git commit -am "feat(agent): conversation SSE router with guardian"`

### Task 5.4: Pathway + handover routers

**Files:** Create `agent/app/routers/pathway.py`, `agent/app/routers/handover.py`; mount; tests.

- [ ] **Step 1: Failing tests** — `GET /pathway?session_id=...&mode=scripted` returns 4 camelCase columns each with `whyThisForYou`; `GET /handover?session_id=...` returns a `CareBrief` naming Care Corner.

```python
def test_pathway_returns_traced_columns(client):
    sid = client.post("/session", json={"persona": "mdm_tan"}).json()["sessionId"]
    cols = client.get(f"/pathway?session_id={sid}&mode=scripted").json()
    assert len(cols) == 4 and all(c["whyThisForYou"] for c in cols)


def test_handover_names_care_corner(client):
    sid = client.post("/session", json={"persona": "mdm_tan"}).json()["sessionId"]
    brief = client.get(f"/handover?session_id={sid}").json()
    assert "Care Corner" in brief["provider"]
    assert brief["coordinator"]
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/routers/pathway.py`** — build via `pathway.build_pathway`, run items through `guardian_client.check_pathway` (attach/verify provenance), return `[col.model_dump(by_alias=True) for col in cols]`. Implement `agent/app/routers/handover.py` — assemble `CareBrief` from the session profile + persona-specific coordinator (`Aunty Mei` for Mdm Tan), `provider="Care Corner ICCP"`, `generated_at=datetime.now(timezone.utc).isoformat()`.

- [ ] **Step 4: Mount + run → PASS. Commit** — `git commit -am "feat(agent): pathway + handover routers"`

### Task 5.5: Autopilot router (SSE progression)

**Files:** Create `agent/app/routers/autopilot.py`; mount; test.

- [ ] **Step 1: Failing test** — `POST /autopilot?session_id=...` streams ≥6 `service_update` events ending with `done`; the coordinator (Care Corner) reaches `routed`.

```python
def test_autopilot_streams_updates(client):
    sid = client.post("/session", json={"persona": "mdm_tan"}).json()["sessionId"]
    with client.stream("POST", f"/autopilot?session_id={sid}&fast=1") as r:
        body = "".join(r.iter_text())
    assert body.count("service_update") >= 6
    assert "routed" in body and "done" in body
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `agent/app/routers/autopilot.py`** — emit `initial_services` first (all `service_update`, status `pending`), then replay `progression_plan` with `asyncio.sleep(step.delay_s)` between updates (`fast=1` query param sets delays to ~0 for tests). Each outward action is passed through `guardian_client.check_autopilot_action` so the human-gate flag is set on risky cards. End with `{"type":"done"}`.

- [ ] **Step 4: Mount + run → PASS. Commit** — `git commit -am "feat(agent): autopilot SSE progression router"`

### Task 5.6: Agent Dockerfile + startup pre-warm

**Files:** Create `agent/Dockerfile`, `agent/.dockerignore`; modify `agent/app/main.py`

- [ ] **Step 1: Add pre-warm to `main.py`** — on `@app.on_event("startup")`, if live mode is active, fire one throwaway `claude_client.run_turn(history=[], message="warmup", profile={})` in a thread, swallowing errors (review fix: avoids first-call latency on stage).

- [ ] **Step 2: `agent/Dockerfile`** (same shape as guardian, port 8000, `EXPOSE 8000`, `CMD uvicorn app.main:app --host 0.0.0.0 --port 8000`).

- [ ] **Step 3: Build** — `docker build -t carekaki-agent ./agent` → success.

- [ ] **Step 4: Commit** — `git commit -am "feat(agent): containerize + model pre-warm"`

---

## Phase 6 — Wire the web (keep the design, make it live)

### Task 6.1: BFF route handlers + typed client

**Files:** Create `lib/api.ts`, `app/api/session/route.ts`, `app/api/conversation/route.ts`, `app/api/pathway/route.ts`, `app/api/autopilot/route.ts`, `app/api/handover/route.ts`

> Read first: `node_modules/next/dist/docs/` route-handler + streaming guide (per AGENTS.md — this Next.js differs from training data). Verify the route handler signature and the SSE/streaming response API before writing.

- [ ] **Step 1: `lib/api.ts`** — `AGENT_URL = process.env.AGENT_URL ?? "http://localhost:8000"`; helpers `createSession(persona)`, plus a `withMode(url)` that appends `?mode=` from a module-level flag toggled by the persona/scripted control.

- [ ] **Step 2: `app/api/session/route.ts`** — `POST` proxies to `${AGENT_URL}/session`, sets a `session_id` httpOnly cookie from the response, returns `SessionInfo`.

- [ ] **Step 3: `app/api/conversation/route.ts`** — `POST` reads `session_id` cookie, forwards `{sessionId, message}` + `mode` query to `${AGENT_URL}/conversation`, and pipes the upstream SSE `ReadableStream` straight through with `Content-Type: text/event-stream`. (Confirm the streaming pass-through idiom in the local Next docs.)

- [ ] **Step 4: `app/api/pathway/route.ts`, `app/api/handover/route.ts`** — `GET` JSON proxy with cookie → `session_id`.

- [ ] **Step 5: `app/api/autopilot/route.ts`** — `POST` SSE pass-through like conversation.

- [ ] **Step 6: Manual smoke** — `docker compose up agent guardian` (compose added in Phase 7; for now run agent locally: `cd agent && uvicorn app.main:app --port 8000`), `npm run dev`, `curl -N -X POST localhost:3000/api/session -d '{"persona":"mdm_tan"}'`. Verify cookie + JSON.

- [ ] **Step 7: Commit** — `git add lib/api.ts app/api && git commit -m "feat(web): BFF route handlers + typed client"`

### Task 6.2: Live chat via SSE (preserve hook contract)

**Files:** Modify `hooks/useChatState.ts`

- [ ] **Step 1: Replace the mock body of `sendMessage`** with a `fetch("/api/conversation", {method:"POST", body: JSON.stringify({message: content})})` reader that parses `data:` lines into `ConversationEvent`s: append `token` text to a growing assistant message, apply `profile_patch` via the existing `updateProfile`, clear `isThinking` on first token, clear `isProfileUpdating` on `done`. On stream error, keep the existing graceful behavior (no error flash — show the last good state). **Keep the returned object shape identical** (the documented stable contract). Initialize `messages`/`profile` empty (or from a seeded session) instead of importing `mockMessages`/`mockCareProfile`.

- [ ] **Step 2: Manual verify** — type in chat; watch `LiveCareProfile` fields populate as patches arrive (slide 4).

- [ ] **Step 3: Commit** — `git commit -am "feat(web): live SSE chat, preserved hook contract"`

### Task 6.3: Live pathway + autopilot + handover pages

**Files:** Modify `app/(main)/pathway/page.tsx`, `app/autopilot/page.tsx`, `components/autopilot/AutopilotDashboard.tsx`; add a handover view (Care Brief) surfaced from autopilot.

- [ ] **Step 1: Pathway** — fetch `/api/pathway` on mount (client component / dynamic), render the existing `PathwayBoard` with live columns; keep the green why-tags wired to `whyThisForYou` (slide 5). Remove `mockPathwayColumns` import.

- [ ] **Step 2: Autopilot** — open an `EventSource`/`fetch`-reader on `/api/autopilot`, apply each `service_update` into dashboard state so the six cards progress in parallel; show a visible Guardian indicator and a **human-gate** badge on any card with `requires_human` (slide 6). Make the **Care Corner ICCP coordinator card the hero** (top/left, larger). Remove `mockAutopilotServices` import.

- [ ] **Step 3: Handover** — add a "Care Brief" panel/modal fetching `/api/handover`, presented as the warm handover to the Care Corner coordinator (CEO-review hero framing).

- [ ] **Step 4: Manual verify** the full click-path: landing → chat → pathway → autopilot → Care Brief.

- [ ] **Step 5: Commit** — `git commit -am "feat(web): live pathway, autopilot progression, Care Brief handover"`

### Task 6.4: Coordinator escalation + scripted-mode control

**Files:** Modify `components/layout/Header.tsx` (or per-screen), `lib/api.ts`

- [ ] **Step 1: Per-screen "Talk to a coordinator" control** (Guardian principle 6) routing to a simple confirmation that the Care Corner coordinator is one click away.

- [ ] **Step 2: Hidden scripted-mode flip** — a keyboard shortcut (e.g. `Shift+D`) or `?mode=scripted` URL param that sets the module flag in `lib/api.ts` so all subsequent calls append `?mode=scripted` — no restart (DX review fix). Show a tiny unobtrusive "demo-safe" dot when active.

- [ ] **Step 3: Commit** — `git commit -am "feat(web): coordinator escalation + no-restart scripted flip"`

---

## Phase 7 — Compose, k8s on kind, infra

### Task 7.1: docker-compose + web Dockerfile + .env.example + Makefile

**Files:** Create `docker-compose.yml`, `web/Dockerfile`, `.env.example`, `Makefile`

- [ ] **Step 1: `web/Dockerfile`** — Next.js 16 production build (`npm ci && npm run build`, `CMD npm start`), `EXPOSE 3000`. Confirm standalone-output guidance in `node_modules/next/dist/docs/` before finalizing.

- [ ] **Step 2: `docker-compose.yml`** — services `web` (3000, `AGENT_URL=http://agent:8000`), `agent` (8000, `GUARDIAN_URL=http://guardian:8001`, `ANTHROPIC_API_KEY`, `DEMO_MODE`, `CLAUDE_TIMEOUT_SECONDS`), `guardian` (8001); healthchecks hitting `/health`; `depends_on`.

- [ ] **Step 3: `.env.example`** — `ANTHROPIC_API_KEY=`, `DEMO_MODE=live`, `CLAUDE_TIMEOUT_SECONDS=3`. (Synthetic data only — never real NRIC/PII.)

- [ ] **Step 4: `Makefile`** — `make demo` = `docker compose up --build`; `make scripted` = `DEMO_MODE=scripted docker compose up --build`; `make test` = run both pytest suites; `make kind` = Task 7.2 flow.

- [ ] **Step 5: Verify** — `make demo`, hit `localhost:3000`, run the full path. Then `DEMO_MODE=scripted` works with no key.

- [ ] **Step 6: Commit** — `git add docker-compose.yml web/Dockerfile .env.example Makefile && git commit -m "feat(infra): compose, web image, env, makefile"`

### Task 7.2: Kubernetes manifests on kind

**Files:** Create `k8s/kind-config.yaml`, `k8s/namespace.yaml`, `k8s/guardian.yaml`, `k8s/agent.yaml`, `k8s/web.yaml`, `k8s/ingress.yaml`

- [ ] **Step 1: `k8s/kind-config.yaml`** — single control-plane node with `extraPortMappings` 80→ingress for local access.

- [ ] **Step 2: Deployments + Services** for `guardian`, `agent`, `web` (one file each): Deployment (1 replica, container port, readiness/liveness probe on `/health`, env from a `Secret`/`ConfigMap` for `ANTHROPIC_API_KEY`/`DEMO_MODE`), plus a ClusterIP Service. `web` Service typed for ingress.

- [ ] **Step 3: `k8s/ingress.yaml`** — route `/` → `web`. (Use the nginx ingress controller installed in Step 5.)

- [ ] **Step 4: `make kind`** runs: `kind create cluster --config k8s/kind-config.yaml`; `kind load docker-image carekaki-web carekaki-agent carekaki-guardian`; `kubectl apply -f k8s/`.

- [ ] **Step 5: Install ingress** — `kubectl apply -f https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml`; wait ready.

- [ ] **Step 6: Verify orchestration** — `kubectl get pods -n carekaki` shows 3 Running; open `http://localhost/` and run the demo path on the cluster (slide 8 proof). Capture `kubectl get pods` output for the deck.

- [ ] **Step 7: Commit** — `git add k8s && git commit -m "feat(infra): kubernetes manifests + kind local cluster"`

---

## Phase 8 — Stage hardening, persona switch (last), demo-day artifacts

### Task 8.1: Persona switch (built last)

**Files:** Modify `components/chat/ChatPanel.tsx` (sub-header control), `lib/api.ts`, possibly `app/(main)/chat/page.tsx`

- [ ] **Step 1: "Switch persona" control** — re-creates the session with the other persona (`POST /api/session {persona}`), then instantly loads that persona's pre-seeded profile + conversation + pathway via the scripted fixtures (design-review fix: a **fast flip, not a live re-run**). For Mr Lim, pre-populate the chat with his scripted turns already rendered so slide 7 lands in seconds.

- [ ] **Step 2: Verify divergence** — switching Mdm Tan ⇄ Mr Lim yields visibly different profile → pathway → autopilot through the same endpoints (slide 7).

- [ ] **Step 3: Commit** — `git commit -am "feat(web): instant persona switch (Mdm Tan / Mr Lim)"`

### Task 8.2: End-to-end rehearsal test (the test that protects 23 Jun)

**Files:** Create `agent/tests/test_e2e_demo_path.py` (httpx against the running stack, scripted mode)

- [ ] **Step 1: Write the E2E** — mirror the exact stage click-path in scripted mode: create session (mdm_tan) → 4 `/conversation` turns asserting profile fields fill → `/pathway` returns 4 traced columns → `/autopilot` streams ≥6 updates incl. `routed` → `/handover` names Care Corner → create session (mr_lim) and assert pathway titles differ from Mdm Tan's.

```python
import httpx

BASE = "http://localhost:8000"  # run against compose/kind

def test_full_demo_path_scripted():
    with httpx.Client(base_url=BASE, timeout=10) as c:
        sid = c.post("/session", json={"persona": "mdm_tan"}).json()["sessionId"]
        for msg in ["mum fell", "needs a walker, I work", "hypertension", "ok"]:
            r = c.post(f"/conversation?mode=scripted", json={"sessionId": sid, "message": msg})
            assert r.status_code == 200
        cols = c.get(f"/pathway?session_id={sid}&mode=scripted").json()
        assert len(cols) == 4 and all(col["whyThisForYou"] for col in cols)
        with c.stream("POST", f"/autopilot?session_id={sid}&fast=1") as r:
            body = "".join(r.iter_text())
        assert "routed" in body and body.count("service_update") >= 6
        brief = c.get(f"/handover?session_id={sid}").json()
        assert "Care Corner" in brief["provider"]
        lim = c.post("/session", json={"persona": "mr_lim"}).json()["sessionId"]
        lim_cols = c.get(f"/pathway?session_id={lim}&mode=scripted").json()
        assert [x["title"] for x in lim_cols] != [x["title"] for x in cols]
```

- [ ] **Step 2: Run against compose** — `make demo` in one shell, `pytest agent/tests/test_e2e_demo_path.py -v` → PASS.

- [ ] **Step 3: Commit** — `git commit -am "test(e2e): scripted demo-path rehearsal"`

### Task 8.3: Demo-day runbook + Q&A doc

**Files:** Create `docs/demo-day-runbook.md`, `docs/qa-prep.md`

- [ ] **Step 1: `docs/demo-day-runbook.md`** — exact start command (`make demo` and `make kind`), env vars, health-check URLs, the **recovery tree** ("chat hangs → already covered by 3s timeout + invisible fallback; if it still feels slow → `Shift+D` for scripted; wifi dies → scripted needs no network; pod crash → `kubectl rollout restart`"), and the deck-to-app mapping (live app inside slides 3–7).

- [ ] **Step 2: `docs/qa-prep.md`** — the honest answers: **"Is Autopilot real or faked?"** → "Reasoning and orchestration are real; outward integrations (AIC/HomeNursing/WhatsApp) are simulated and clearly labelled — Guardian gates every outward action behind a human." Plus the Full-vs-Demonstrative Guardian table and the "reads the room" persona-divergence point.

- [ ] **Step 3: Commit** — `git add docs/demo-day-runbook.md docs/qa-prep.md && git commit -m "docs: demo-day runbook + Q&A prep"`

### Task 8.4: Final rehearsal pass

- [ ] **Step 1:** Run `make test` (both pytest suites green) and `make demo`; execute the full stage path live, then again with `Shift+D` scripted; then on kind. Fix anything that flashes, hangs >3s, or breaks. Capture the `kubectl get pods` screenshot for slide 8.
- [ ] **Step 2: Commit** any polish — `git commit -am "chore: final stage-hardening pass"`

---

## Self-review against the spec

**Spec coverage:**
- §2 architecture (web/agent/guardian, gateway) → Phases 1,2,5,6,7. ✅
- §3 hybrid engine (live default, scripted fallback, timeout, same schema) → Tasks 4.1–4.2; timeout 3s (review fix) in config. ✅
- §4 data flow one-session-four-screens → session store 2.3, routers 5.x, web 6.x. ✅
- §5 two personas one engine → scripted 3.1, persona switch 8.1. ✅
- §6 Guardian six principles → Phase 1 (1: medical 1.3; 2: PDPA 1.2; 3: human-gate 1.5/5.5; 4: provenance 1.4/5.4; 5: decision log 1.4; 6: escalation 6.4). ✅
- §7 deployment (compose + k8s proof) → Phase 7; **upgraded to live kind run** per 18 Jun decision. ✅
- §8 testing (profile, pathway, guardian, hybrid, smoke) → unit tests throughout + E2E 8.2. ✅
- §9 frontend changes → Phase 6 (hook contract preserved, animated profile, live pathway/autopilot, persona switch, guardian surfacing). ✅
- §10 build phases → mapped 1:1 to Phases 1–8. ✅
- §11 risks → fallback (4.2), 3s timeout + pre-warm (config, 5.6), server-side session (2.3), no-restart flip (6.4), honesty doc (8.3). ✅

**Review findings folded in:** single Claude call (4.1) ✅ · 3s timeout + pre-warm (config, 5.6) ✅ · instant persona load (8.1) ✅ · no-restart `?mode=scripted` (6.4) ✅ · runbook (8.3) ✅ · E2E rehearsal (8.2) ✅ · invisible fallback (4.2) ✅ · Care Corner hero (5.5/6.3, handover 5.4) ✅ · Q&A honesty (8.3) ✅ · synthetic-data-only note (7.1) ✅. SSE-proxy-vs-direct: kept BFF proxy (preserves the "one gateway" slide) with a verify step in 6.1.

**Open verification flags for the implementer:**
- Next.js 16 route-handler streaming idiom — confirm against `node_modules/next/dist/docs/` (AGENTS.md warns APIs differ from training data) before Task 6.1.
- Anthropic SDK version `0.42.0` and `claude-sonnet-4-6` id — verify current at build time via the claude-api skill.
- kind ingress-nginx manifest URL — pin/verify before relying on it on demo day.
</content>
