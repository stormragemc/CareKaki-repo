# CareKaki — Working Prototype Design

**Date:** 2026-06-03
**Target:** Dell InnovateDash 2026 Final Presentation — 23 June 2026, 2–5pm, Dell office
**Status:** Approved design, ready for implementation planning

---

## 1. Context & goal

CareKaki is a Top-5 finalist in the Dell InnovateDash Hackathon 2026 (partner: Care Corner
Singapore, an ICCP provider). The 24 May video submission got the team into the final. This
spec covers the **working prototype** to be demoed live at the 23 June final.

The problem statement explicitly scores:
- **Cloud-native architecture** — containerization, container orchestration, microservices, API-driven design.
- **Responsible AI** — beyond traditional chatbots / matching platforms.
- **Client-profile understanding**, self-navigation, personalized recommendations, human-supported escalation and handover. NOT a directory/listing app.

The existing codebase is a polished but fully static Next.js 16 / React 19 / Tailwind v4 mock
of four screens (landing, chat, pathway, autopilot) plus a do-nothing FastAPI stub. The visual
layer is strong and is **kept**. This project makes it *live and reliable on stage*.

The 12-slide demo script (`~/Library/Containers/ru.keepcoder.Telegram/Data/tmp/CareKaki_Demo_Script.md`)
is the source of truth for the narrative. The live app is demoed inside **slides 3–7**; slides
1, 2, 8–12 remain a presentation deck.

### Success criteria
1. A judge can type into the chat and watch the Living Care Profile assemble field-by-field (slide 4).
2. The pathway is generated *from that profile*, each item carrying a "why" tag traced to a profile fact (slide 5).
3. Autopilot shows six services progressing through statuses in parallel (slide 6).
4. A persona switch (Mdm Tan ↔ Mr Lim) produces a visibly different profile → pathway → autopilot through the same engine (slide 7).
5. The architecture is genuinely cloud-native (real containers + API boundaries + k8s manifests) (slide 8).
6. Guardian is a real, separate service enforcing Responsible-AI rules (slide 9).
7. The demo runs flawlessly even if the network/LLM fails (hybrid engine with scripted fallback).

### Non-goals
- Rebuilding slides 1, 2, 8–12 as in-app pages (they stay a deck).
- Real integrations with AIC / HomeNursing.sg / WhatsApp Business (simulated, clearly).
- Production-grade auth, persistence, or multi-tenant infrastructure.
- A live cloud deployment for the presentation (we run locally from compose; see §7).

---

## 2. Architecture (Option 1 — Pragmatic cloud-native)

Three real containers behind one gateway, wired with `docker-compose`; Kubernetes manifests
committed as proof for slide 8.

```
┌─────────────┐     ┌──────────────────────────────┐     ┌────────────┐
│   web       │────▶│   agent  (FastAPI)           │────▶│  guardian  │
│ Next.js 16  │     │  /conversation /profile      │     │ (FastAPI)  │
│ UI + BFF    │◀────│  /pathway /autopilot         │◀────│ PDPA · no- │
│  gateway    │ SSE │  /handover  /session         │     │ med-advice │
└─────────────┘     │  ↳ Claude (hybrid + fallback)│◀────│ · trace    │
                    └──────────────────────────────┘     └────────────┘
```

The five "microservices" from slide 8 (Conversation, Profile Builder, Pathway Reasoner,
Autopilot, Handover) are implemented as **named routers inside the `agent` service** — honest
service boundaries with real HTTP APIs, without operating seven brittle pods. `guardian` is a
**separate container** because slide 9 promises "an actual service, not a prompt instruction."

### Containers

| Container | Tech | Responsibility |
|-----------|------|----------------|
| `web` | Next.js 16, React 19, Tailwind v4 | UI (4 screens) + BFF gateway: Next.js route handlers proxy to `agent`, hold the session cookie, stream SSE to the browser. |
| `agent` | FastAPI (Python 3.13) | The brain. Five routers + a session store. Calls Claude with structured (JSON-schema tool) outputs. Calls `guardian` before returning/acting. |
| `guardian` | FastAPI (Python 3.13) | Responsible-AI service. Stateless. Validates/annotates payloads. |

### Why these boundaries
- `web` owns presentation + the gateway role (maps to "one API gateway" on slide 8).
- `agent` owns reasoning + state (maps to the 5 microservices + the LLM-with-tools core).
- `guardian` is isolated so its independence is demonstrable (request it directly, show it reject a medical-advice payload).

---

## 3. The hybrid engine (stage safety net)

`agent` selects its response source at request time:

1. **Live mode (default):** call Claude (**Sonnet 4.6** — `claude-sonnet-4-6`, chosen for
   latency over depth in a 4-turn demo). Structured outputs (profile fields, pathway columns)
   use JSON-schema tool calls so they parse reliably rather than free-text.
2. **Fallback mode:** deterministic, per-persona scripted responses, used automatically when
   any of these holds:
   - `ANTHROPIC_API_KEY` is absent, OR
   - the Claude call errors or exceeds a timeout (default 8s), OR
   - `DEMO_MODE=scripted` is set explicitly.

Both modes return the **same response schema**, so the frontend and UI are identical. On 23
June the team can flip `DEMO_MODE=scripted` for a guaranteed-deterministic run, or leave it live.
The scripted fixtures double as deterministic test data (§8).

Model access uses the Anthropic SDK directly (`ANTHROPIC_API_KEY`). (Vercel AI Gateway is an
option but adds a dependency we don't need for a laptop-local demo.)

---

## 4. Data flow — one session, four screens

The care profile is built in chat and consumed in pathway and autopilot, so it must persist
across routes. State lives **server-side in `agent`**, in an in-memory session store keyed by a
`session_id` cookie set by `web`. (In-memory is acceptable for a demo; it also keeps the
"API-first, state in the service" story honest.)

```
Landing  ──pick mode──▶  /chat  ──"View care plan"──▶  /pathway  ──"Launch Autopilot"──▶  /autopilot
```

### 4.1 Chat (slide 4)
- User sends a message → `web` route handler → `agent POST /conversation` with `{session_id, message}`.
- `agent`:
  1. Appends to session history.
  2. Calls Claude (or fallback) for the assistant reply **and** a structured profile delta (via `/profile` logic / same turn).
  3. Sends the reply + any sensitive fields through `guardian` (PDPA redaction, medical-advice check).
  4. Returns an SSE stream: assistant text tokens + `profile_patch` events.
- `web` streams to the browser. `LiveCareProfile` animates each field as its patch arrives.

### 4.2 Pathway (slide 5)
- On navigation, `web` calls `agent GET /pathway?session_id=…`.
- `agent` reasons a personalized 4-column plan from the session `CareProfile` (Claude structured
  output, or fallback). Each item includes a `why` string **traced to a specific profile fact**
  (e.g. `"lives alone post-discharge"`). `guardian` attaches/verifies provenance.
- `/pathway` renders the existing 4-column board with live data and green why-tags.

### 4.3 Autopilot (slide 6)
- "Launch Autopilot" → `web` calls `agent POST /autopilot` → returns the 6 services derived from
  the pathway.
- Statuses **progress over time** (e.g. `pending → submitted`, `pending → scheduled`) via an SSE
  stream of `service_update` events from `agent`. The dashboard animates them in parallel under a
  visible Guardian indicator.

### 4.4 Handover
- `agent GET /handover?session_id=…` produces the coordinator **Care Brief** (the warm-handover
  artifact) — a structured summary the "least-loaded ICCP coordinator" receives.

---

## 5. Two personas, one engine (slide 7)

Two seed personas drive the same endpoints:

| | **Mdm Tan** | **Mr Lim** |
|---|---|---|
| Mode | Caregiver (daughter Wei Ling) | Self / family overseas |
| Situation | 78, fall, discharged, lives alone, daughter overwhelmed | 72, fall, discharged, kids in London |
| Key risk | Coordination load on working caregiver | Loneliness, no family in the room |
| Pathway diverges | Home Caregiving Grant, Home Nursing | Silver Support, Active Ageing Centre, weekly check-ins |
| Autopilot diverges | WhatsApp to Wei Ling; ICCP route to Aunty Mei | WhatsApp thread to daughter in London |

A **"Switch persona" control** re-seeds the session and replays through the *same* `/conversation`,
`/profile`, `/pathway`, `/autopilot` endpoints, producing a visibly different result. In live mode
the divergence is genuinely reasoned by Claude from the differing inputs; in fallback mode it is
the per-persona scripted fixtures. This is the "same intent, different context — CareKaki reads
the room" proof.

---

## 6. Guardian — Responsible-AI service (slide 9)

A real, separate FastAPI service enforcing six principles. The spec is honest about depth:

| # | Principle | Depth | Implementation |
|---|-----------|-------|----------------|
| 1 | No medical advice | **Full** | Classifier on outgoing assistant text + on user intent; clinical questions are flagged and routed to a human, not answered. |
| 2 | PDPA-aware at ingest | **Full** | Redaction of identifiers (NRIC pattern, etc.) before logging and in non-essential outputs. |
| 3 | Human-in-the-loop on risk | **Demonstrative** | Risky autopilot actions carry a `requires_human` flag; UI shows a human gate rather than silently acting. |
| 4 | Traceability | **Full** | Every pathway/autopilot recommendation carries provenance linking it to a profile fact; surfaced as the green why-tags. |
| 5 | Bias monitoring | **Demonstrative** | Decisions are written to a structured decision log; a note explains the "reviewed weekly with Care Corner" process. |
| 6 | Coordinator one click away | **Full** | An escalation control on every screen routes to a human coordinator. |

`guardian` is callable independently so the team can demonstrate it rejecting a medical-advice
payload during Q&A. "Full" vs "Demonstrative" labels are stated openly — judges reward honesty
over overclaiming.

---

## 7. Deployment & demo operation

- **Local demo (the presentation):** `docker-compose up` brings up `web`, `agent`, `guardian` on
  the presenter's laptop. The only external dependency is the Claude API, which the fallback fully
  covers. This avoids depending on Dell venue wifi. `DEMO_MODE=scripted` gives a fully offline,
  deterministic run if desired.
- **Cloud-native proof (slide 8):** Kubernetes manifests (Deployments + Services for the three
  containers, plus an Ingress) are committed under `/k8s`. They are shown as evidence and can be
  applied to a local `kind`/`minikube` cluster on demand, but are **not** the presentation runtime.
- **Optional later:** the same images can be pushed to a registry and deployed to a cloud cluster
  if the team wants; nothing in Option 1 blocks an upgrade to full per-service decomposition.

### Configuration
- `ANTHROPIC_API_KEY` — enables live mode; absence forces fallback.
- `DEMO_MODE` — `live` (default) or `scripted`.
- `CLAUDE_TIMEOUT_SECONDS` — fallback trigger threshold (default 8).
- Service URLs (`AGENT_URL`, `GUARDIAN_URL`) injected via compose / k8s.

---

## 8. Testing

The three reasoning units are tested in isolation; the scripted fallback fixtures double as
deterministic test inputs.

- **Profile extraction** — given a fixed transcript, assert the expected `CareProfile` fields.
- **Pathway reasoner** — given a fixed `CareProfile`, assert the expected 4-column structure and
  that each item carries a non-empty `why` traced to a profile field.
- **Guardian** — PDPA redaction removes identifiers; medical-advice classifier flags clinical
  questions and passes benign ones; traceability provenance is attached.
- **Hybrid switch** — with no API key / `DEMO_MODE=scripted`, endpoints return the scripted
  schema-valid payloads.
- **Smoke** — `docker-compose up` then hit each endpoint; persona switch yields divergent output.

---

## 9. Frontend changes (keep the design, make it live)

- `hooks/useChatState.ts` — replace the mock timeout with an SSE client to `web`'s `/conversation`
  proxy; apply `profile_patch` events via the existing `updateProfile`; keep fallback behavior if
  the stream errors. The hook's return shape (the documented "stable contract") is preserved.
- `components/chat/LiveCareProfile.tsx` — animate field arrival (each row transitions in as its
  patch lands; "updating" indicator already exists).
- `app/(main)/pathway/page.tsx` — fetch from the session `/pathway` instead of importing
  `mockPathwayColumns`; make it a client/dynamic read of live data.
- `app/autopilot/page.tsx` + `AutopilotDashboard` — subscribe to `service_update` SSE; progress
  statuses over time instead of static `mockAutopilotServices`.
- **Persona switch** — a control (e.g. in the chat sub-header) to re-seed the session.
- **Guardian surfacing** — provenance why-tags (reuse existing green tags), a per-screen
  coordinator-escalation control, and the human-gate indicator on risky autopilot cards.
- `lib/mock-data.ts` — retained and extended into the **scripted fixtures** for both personas
  (Mdm Tan exists; add Mr Lim), consumed by the fallback engine.

---

## 10. Build phases (sequencing — detailed plan to follow)

1. **Backend skeleton** — `agent` + `guardian` FastAPI services, schemas mirroring `lib/types.ts`,
   Dockerfiles, `docker-compose`, health checks. Replace the broken stub.
2. **Hybrid engine + session** — Claude integration with structured outputs, scripted fallback,
   in-memory session store, `/conversation` + `/profile`.
3. **Wire chat live** — `web` SSE proxy, `useChatState` rewrite, animated `LiveCareProfile` (slide 4 working end-to-end).
4. **Pathway reasoner** — `/pathway` from session profile with traced why-tags; live `/pathway` page (slide 5).
5. **Autopilot + handover** — `/autopilot` progression stream, `/handover` Care Brief; animated dashboard (slide 6).
6. **Guardian integration** — wire the six principles through the chain; independent-demo endpoint (slide 9).
7. **Mr Lim persona** — second fixture + persona switch; verify divergent chain (slide 7).
8. **k8s manifests + polish** — `/k8s` manifests, tests green, rehearsal pass, `DEMO_MODE=scripted` verified offline.

---

## 11. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| LLM latency/failure on stage | Hybrid fallback + `DEMO_MODE=scripted`; 8s timeout. |
| Venue wifi unreliable | Run from compose on the laptop; scripted mode needs no network. |
| Structured output drift from Claude | JSON-schema tool calls + validation; fall back on parse failure. |
| Cross-route state loss | Server-side session in `agent` keyed by cookie. |
| Scope creep into full k8s | Boundaries fixed at 3 containers; k8s is manifests-as-proof only. |
| Over-claiming Responsible AI | Each Guardian principle labeled Full vs Demonstrative openly. |
