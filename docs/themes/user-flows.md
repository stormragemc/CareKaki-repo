# CareKaki — User Flows (Build Guide)

> Concrete, end-to-end user journeys derived from `product-source-of-truth.md` and
> `slide-fixes.md` (the canonical product spec). This doc maps **every step** to:
> the **screen**, the **service / API call** behind it, and whether each integration is
> **REAL** or **SIMULATED**. It also includes a per-step **build-gap analysis** against the
> current codebase, plus a 10-minute demo run-of-show.
>
> When this doc conflicts with product *intent*, the source-of-truth wins. This file is the
> operational bridge between that intent and the code.

---

## 0. Decisions locked (read first)

These were resolved with the team and are assumed throughout:

| Decision | Resolution |
|---|---|
| **Consent placement** | Singpass/MyInfo is a **gate after landing, before conversation** (means-tested fields are ready before the chat starts; matches §6c "consents once at onboarding"). |
| **Caregiver delegation** | In caregiver mode, **Mdm Tan (the senior) consents** at onboarding so **Wei Ling acts on her behalf** (§6c delegation). |
| **Medication review** | **Pathway-only** (Weeks 2–8). Autopilot stays at the **canonical 5 services**. |
| **Warm handover** | A **dedicated Care Brief finale screen** ("what Aunty Mei sees"), not just a tile. |
| **Persona ↔ mode** | **Bound for the demo:** caregiver mode = Mdm Tan, self mode = Mr Lim. |
| **LLM** | Flows are model-agnostic ("the LLM / reasoning plane"). **Target = Claude Sonnet 4.6 via Vertex AI**; **current code = Gemini** (see Build note). |

**Build note — LLM drift:** the design spec (`prototype-design.md` §3) specifies Claude Sonnet 4.6;
the live backend (`backend/main.py`) currently calls Gemini. Target is Claude on **Vertex AI**
(bills through GCP, usable against the $300 GCP trial credit; demo token cost is negligible).
Switching is: enable Vertex AI API → request Claude Sonnet 4.6 in Model Garden → point the
Anthropic SDK at the Vertex endpoint with `gcloud` auth. The flows below do not depend on which
model is used.

---

## 1. Integration legend (§6a posture: anchor real, simulate the rest — never substitute)

| Tag | Meaning | In these flows |
|---|---|---|
| 🟢 **REAL** | Genuinely live in the demo | **WhatsApp** (Meta Business Cloud API), **Singpass + MyInfo** (official **sandbox**, real consent flow in test mode), **Google Calendar** (real nurse-visit invite) |
| 🟡 **SIMULATED** | Simulated against the agency's real interface; going live is a partnership/data-governance step, not engineering | **AIC** Home Caregiving Grant, **Home Nursing** (HNF / NTUC Health), **ICCP / Care Corner** routing, **polyclinic / medication** |
| ⚙️ **ORCHESTRATION** | Always real — fan-out, async state, status progression | The Autopilot Orchestrator itself |

> Q&A framing: *"The orchestration is live — you saw a real WhatsApp, a real calendar invite, and
> identity + data flowing through the official Singpass/MyInfo sandbox. The agency actions (AIC,
> ICCP, polyclinic) are simulated against their real interfaces, because going live there is a
> partnership and data-governance approval, not engineering. The sandbox is the same door, just in
> test mode."*

---

## 2. The shared 6-stage skeleton

Both personas run the **same engine**; only seeding, tone, and who-gets-notified diverge (§5).

```
Stage 0          Stage 1                 Stage 2                    Stage 3        Stage 4                       Stage 5
Landing  ──▶  Singpass + MyInfo  ──▶  Conversation /        ──▶  Pathway   ──▶  Autopilot                ──▶  Warm Handover
"Who is       consent (gate)          Living Care Profile        (why-tags)     (5 services,                  / Care Brief
 this for?"   🟢 REAL (sandbox)        LLM + 🟢 MyInfo fields                    draft-then-confirm,           🟡 SIMULATED (ICCP)
                                                                                under Guardian)
```

Guardian wraps **every** stage (PDPA scrub, no-medical-advice, traceability, one-click-to-human).
It is a **layer/shield**, never a tile or a service in the count.

| Stage | Screen | Service / API | Integrations |
|---|---|---|---|
| 0 Landing | `/` | none (routes to `/chat?mode=…`) | — |
| 1 Consent | **new** `/consent` (or modal) | `web → agent /auth/singpass` (OIDC), then `/myinfo/consent` → signed fields | 🟢 Singpass + MyInfo (sandbox) |
| 2 Conversation | `/chat` (split: chat + Living Care Profile) | `web → agent /conversation` → `{reply, profile_patch}` (SSE) | LLM (real); 🟢 means-tested fields from MyInfo; Guardian |
| 3 Pathway | `/pathway` (4 columns + why-tags) | `agent /pathway` from session profile; Guardian provenance | reasoning real; 🟡 named services |
| 4 Autopilot | `/autopilot` (Guardian shield bar on top) | `agent /autopilot/draft` → approve → `/autopilot/confirm` → SSE `service_update` | ⚙️ orchestration; mix of 🟢/🟡 per service (below) |
| 5 Care Brief | **new** `/handover` | `agent /handover` → structured Care Brief | 🟡 ICCP / Care Corner |

### The 5 Autopilot services (+ Guardian wrapper)

| # | Service | Provider | Integration | Notes |
|---|---|---|---|---|
| 1 | **Financial — Home Caregiving Grant** | AIC | 🟡 SIMULATED (filed with 🟢 MyInfo NRIC/income docs) | "filed with income docs" reconciles with "zero forms" because the docs come from MyInfo |
| 2 | **Clinical — Home nurse visit** | Home Nursing Foundation / NTUC Health | 🟡 SIMULATED booking **+ 🟢 Google Calendar invite** | A real invite lands in the caregiver's calendar |
| 3 | **Social — Active Ageing Centre enrolment** | AAC | 🟡 SIMULATED | The social-care agent; this is what diverges Mr Lim's loneliness case |
| 4 | **Coordination — Care Corner / ICCP warm handover** ⭐ HERO | ICCP / Care Corner | 🟡 SIMULATED routing | Routed to least-loaded officer (Aunty Mei), Care Brief preloaded. **The one action that may bypass confirm — to escalate to a human faster, not to act autonomously** (§4 Beat 4) |
| 5 | **Comms — WhatsApp to family** | Meta WhatsApp Business | 🟢 REAL | A real message lands on a real phone |
| — | **Guardian** (wrapper, not a service) | — | — | Shield/status bar across the top: no medical advice · PDPA scrubbed · human one click away |

### Draft-then-confirm mechanics (§4 Beat 4, §7 principle 3)

1. Autopilot **prepares all 5 as ready-to-send drafts**. Nothing irreversible has happened yet.
2. User approves **per-service** or **"Approve all"** (one tap). Approved drafts transition to live status and progress over time via SSE (`pending → submitted/scheduled/active/routed`).
3. The **only** confirm-bypass is the **ICCP human escalation** (get a coordinator faster) — never autonomous agency action.

---

## 3. Flow A — Caregiver mode (Mdm Tan, 78 · daughter Wei Ling operates)

**Persona:** Wei Ling (local, full-time, 2 kids) is overwhelmed; her mum Mdm Tan fell and was
discharged from SGH this morning, lives alone. **Wei Ling types; Mdm Tan consented at onboarding.**

### A0 — Landing
- **Screen:** `/` — picks **"For someone I care for."**
- **API:** routes to `/chat?mode=caregiver`.
- **Integration:** —
- **Tone:** caregiver framing ("…a plan you can actually act on").

### A1 — Singpass login + MyInfo consent (delegation)
- **Screen:** `/consent` — "Log in with Singpass" → MyInfo consent screen listing exactly the
  requested fields (NRIC, DOB, address, **income from IRAS**, CPF).
- **Delegation:** **Mdm Tan's** Singpass is used; the consent records that **Wei Ling may act on
  her behalf**. (One-time onboarding consent — the answer to "whose Singpass?")
- **API:** `web → agent /auth/singpass` (OIDC) → `/myinfo/consent` → returns signed fields →
  seeds `CareProfile` means-tested fields + financial tier server-side.
- **Integration:** 🟢 **REAL (Singpass/MyInfo sandbox, synthetic persona)**.
- **Why it matters:** this is *how* "0 forms" is literally true — income/NRIC are verified from the
  national source, not typed and not inferred from chat.

### A2 — Conversation / Living Care Profile
- **Screen:** `/chat` — left: chat; right: **Living Care Profile** filling in real time.
- **What's said:** "My mum (78) had a fall. Discharged today. She lives alone." → "She needs a
  walker. I work full-time, two kids."
- **Profile assembled:** name, age, living (alone, lift access), mobility (walker after fall),
  conditions, **caregiver context (Wei Ling, full-time + 2 kids)**, recent event (discharged SGH).
  **Financial tier comes from MyInfo (A1), not the chat.**
- **API:** `web → agent /conversation {session_id, message}` → SSE stream of assistant tokens +
  `profile_patch` events → `LiveCareProfile` animates each field. Guardian runs PDPA scrub +
  no-medical-advice on every turn.
- **Integration:** LLM (real); 🟢 MyInfo-sourced fields; Guardian.

### A3 — Pathway ("Not a list. A plan.")
- **Screen:** `/pathway` — 4 columns with **why-this-for-you** tags.
  - **This Week** — home-safety walk-through, walker + grab-bar fitting, caregiver basics (falls). *Why: "Lives alone post-discharge."*
  - **Weeks 2–8** — Home Nursing Foundation visits, **physio/rehab at SACH** (NOT "polyclinic"), **medication review**. *Why: "Mobility limited; subsidy eligible."*
  - **Apply Now** — **Home Caregiving Grant**, MediFund top-up, CHAS review. *Why: "Per-capita income within tier" (from MyInfo).*
  - **Single Point** — ICCP case officer, family WhatsApp loop, monthly check-in. *Why: "Complex case + working caregiver."*
- **API:** `agent /pathway?session_id=…` → 4 columns, each item with a `why` traced to a profile
  fact; Guardian attaches/verifies provenance.
- **Integration:** reasoning real; 🟡 named services. **Naming fix applied: drop "SACH polyclinic."**
- **Escalation banner:** "This case is complex — a Care Corner coordinator can take it from here →
  Launch Autopilot."

### A4 — Autopilot (5 services, draft-then-confirm, under Guardian)
- **Screen:** `/autopilot` (dark) — Guardian **shield bar** on top; 5 service cards as **drafts**.
- **Draft contents (Mdm Tan):**
  1. **HCG (AIC)** — drafted with MyInfo NRIC + income docs + discharge summary. 🟡 (+🟢 docs)
  2. **Home nurse (HNF/NTUC)** — Tue 9am, lift access + Wei Ling's contact; **Google Calendar invite drafted**. 🟡 booking + 🟢 calendar
  3. **AAC enrolment** — local centre near Mdm Tan. 🟡 *(present but secondary — family is in the room)*
  4. **ICCP warm handover** ⭐ — routed to **Aunty Mei** (least-loaded), Care Brief preloaded. 🟡 *(may escalate immediately)*
  5. **WhatsApp to Wei Ling** — plain-language summary + reassurance thread. 🟢 **REAL**
- **API:** `agent /autopilot/draft` → user **Approve all** → `/autopilot/confirm` → SSE
  `service_update` progresses statuses in parallel. Guardian gates each (`requires_human` where risky).
- **Integration:** ⚙️ orchestration real; per-service 🟢/🟡 as above.

### A5 — Warm handover / Care Brief (the hero)
- **Screen:** `/handover` — the **Care Brief Aunty Mei receives**: profile summary, pathway,
  actions taken, consents, contact = Wei Ling.
- **API:** `agent /handover?session_id=…` → structured Care Brief.
- **Integration:** 🟡 ICCP / Care Corner.
- **Payoff:** *"When Aunty Mei calls tomorrow, she already knows everything. Wei Ling never repeats herself."*
- **Notification:** WhatsApp to **Wei Ling** (🟢). Cadence: **single coordinator callback**.

---

## 4. Flow B — Self mode (Mr Lim, 72 · operates for himself · daughter in London notified)

**Persona clarity (§5 fix):** **Mr Lim self-navigates — he opens the app and types.** His daughter
in London is a **notified family member, not the operator**. Same engine as Flow A; the *context*
(no family in the room → loneliness risk, pension tier) produces a different plan.

### B0 — Landing
- **Screen:** `/` — picks **"For myself."** → `/chat?mode=self`.
- **Tone:** first-person, senior-facing ("…figuring things out").

### B1 — Singpass login + MyInfo consent
- **Screen:** `/consent` — **Mr Lim consents for himself** (no delegation wrinkle here).
- **API:** same as A1; MyInfo returns Mr Lim's fields → **pension/Silver Support tier** derived
  from income/CPF.
- **Integration:** 🟢 REAL (sandbox).

### B2 — Conversation / Living Care Profile
- **Screen:** `/chat` — Mr Lim types in first person ("I had a fall, just got discharged, my
  children are overseas").
- **Profile diverges:** caregiver = **none local (daughter in London)**; the engine flags
  **loneliness / no family in the room** as the key risk.
- **Capture:** the **daughter's contact** is recorded as a **notified family member** (drives the
  WhatsApp-to-London in B4) — explicitly *not* an operator.
- **API:** same `/conversation` SSE; Guardian active.

### B3 — Pathway
- **Screen:** `/pathway` — same 4-column shape, **different content**:
  - **This Week** — home safety, walker fitting, **but no local caregiver to train**. *Why: "Lives alone, family overseas."*
  - **Weeks 2–8** — home nursing, physio/rehab at SACH, medication review. *Why: "Mobility limited."*
  - **Apply Now** — **Silver Support Scheme** (pension tier), CHAS. *Why: "Pension-tier income (MyInfo)."*
  - **Single Point** — ICCP case officer, **weekly check-in cadence**, WhatsApp loop to daughter. *Why: "No family in the room → weekly contact."*
- **API:** `agent /pathway` (same endpoint; divergence is reasoned from differing inputs).
- **Integration:** reasoning real; 🟡 named services.

### B4 — Autopilot (5 services — note what changes)
- **Screen:** `/autopilot` — same 5 + Guardian, **re-weighted**:
  1. **Financial** — **Silver Support** (not HCG), filed with MyInfo data. 🟡 (+🟢)
  2. **Home nurse (HNF/NTUC)** + **Google Calendar invite**. 🟡 + 🟢
  3. **AAC enrolment** ⭐ — **elevated**, because the real risk is **loneliness**. 🟡
  4. **ICCP warm handover** ⭐ — least-loaded officer; **weekly check-in** baked into the brief. 🟡
  5. **WhatsApp to the daughter in London** — summary + reassurance to the overseas family. 🟢 **REAL**
- **API:** same `/autopilot/draft` → `/autopilot/confirm` → SSE.
- **Same engine, different plan** — this is the "reads the room" proof.

### B5 — Warm handover / Care Brief
- **Screen:** `/handover` — Care Brief notes **weekly cadence** + **overseas family contact**.
- **API:** `agent /handover`.
- **Notification:** WhatsApp to **daughter in London** (🟢). Cadence: **weekly check-in**.

---

## 5. Divergence at a glance (same engine, §5)

| Stage | Caregiver — **Mdm Tan, 78** | Self — **Mr Lim, 72** |
|---|---|---|
| Operator | **Wei Ling** (local, full-time, 2 kids) types | **Mr Lim himself** types |
| Notified family | Wei Ling | **Daughter in London** |
| Singpass/MyInfo | Mdm Tan consents; Wei Ling acts on behalf (delegation) | Mr Lim consents for himself |
| Finance | **Home Caregiving Grant** | **Silver Support** (pension tier) |
| Social | AAC present but secondary (family in room) | **AAC elevated** (loneliness is the risk) |
| Check-ins | **Single coordinator callback** | **Weekly** check-in |
| WhatsApp | To Wei Ling | To daughter in London |

---

## 6. Build-gap analysis (target flow vs. current codebase)

Legend: ✅ built · 🟨 mocked/partial · ❌ missing.

| Stage | Status | What exists today | What's mocked | What's missing |
|---|---|---|---|---|
| **0 Landing** | ✅/🟨 | `/` with `ModeCard`; mode passed via `?mode=` query | — | Mode is a **label only** downstream — does not yet truly fork seeding/tone/notifications (§3 slide-fix requires genuine fork) |
| **1 Singpass/MyInfo** | ❌ | — | — | **Entire stage.** No `/consent` screen, no `/auth/singpass`, no `/myinfo/consent`, no sandbox wiring, no delegation handling |
| **2 Conversation/Profile** | 🟨 | `/chat`, `useChatState` → `POST /chat`, live `LiveCareProfile` panel | Profile **pre-seeded with Mdm Tan mock** on load; transcript seeded from `mockMessages` | MyInfo-seeded means-tested fields; **Guardian** (no service); **server-side session** (state currently in `sessionStorage`); **Mr Lim seed**; SSE streaming (currently single JSON response); model is Gemini not Claude |
| **3 Pathway** | 🟨 | `/pathway` calls `POST /pathway` (Gemini) | Falls back to `mockCareProfile`; why-tags exist in `mock-data.ts` | Server session (reads from `sessionStorage`, not a session store); Guardian provenance; **"SACH polyclinic" naming bug present** in `lib/mock-data.ts` |
| **4 Autopilot** | 🟨 | `/autopilot` screen + `AutopilotDashboard` + `ServiceCard` | **Fully static** `mockAutopilotServices` | **No backend at all** (`/autopilot/draft`, `/autopilot/confirm`); **6 tiles incl. Guardian-as-tile** (must be **5 + Guardian wrapper/shield**); **no draft-then-confirm**; no SSE progression; **WhatsApp / Google Calendar / AIC / AAC / ICCP all absent**; header copy still says **"six services"** |
| **5 Care Brief** | ❌ | — | — | **Entire stage.** No `/handover` screen, no Care Brief endpoint/artifact |
| **Cross-cutting** | ❌ | — | — | **`guardian` service** (separate container); **k8s manifests** (`/k8s`); persona-switch / mode fork; SSE transport; Claude-on-Vertex swap |

**Summary:** Stages 0, 2, 3 exist as a live-ish skeleton (single-shot, Gemini, mock-seeded);
**Stages 1, 4 (real logic), and 5 are essentially greenfield.** The two highest-leverage demo
beats — **MyInfo consent (Stage 1)** and **Autopilot draft-then-confirm with the WhatsApp +
Calendar real anchors (Stage 4)** — are exactly the parts not yet built.

### Quick fixes already identifiable in code
- `lib/mock-data.ts`: rename **"Physio at SACH polyclinic" / "Polyclinic SACH"** → "physio/rehab at SACH" (SACH is a community hospital).
- `lib/mock-data.ts` + `AutopilotDashboard.tsx`: collapse Guardian tile into a **wrapper/shield**; reduce to **5 services**; change "six services" copy.
- `mockAutopilotServices`: add **AAC** and **Google Calendar** artifacts; relabel medication out of Autopilot (pathway-only).

---

## 7. Suggested build order (maps gaps → stages)

1. **Backend skeleton + session + Guardian service** (unblocks everything; design spec §10.1–2).
2. **Stage 1 — Singpass/MyInfo sandbox** (`/consent`, `/auth/singpass`, `/myinfo/consent`) — the "zero forms" proof.
3. **Stage 2 wired to session + MyInfo seeding + SSE** (move off `sessionStorage`; add Mr Lim seed).
4. **Stage 3 from session + Guardian provenance** (+ apply the SACH naming fix).
5. **Stage 4 — Autopilot backend: draft-then-confirm, 5 services, Guardian shield, SSE** + 🟢 **WhatsApp** + 🟢 **Google Calendar**.
6. **Stage 5 — `/handover` Care Brief screen.**
7. **Mode fork made genuine** (caregiver=Mdm Tan / self=Mr Lim seeding, tone, notifications).
8. **Claude-on-Vertex swap** + k8s manifests + rehearsal.

---

## 8. Demo run-of-show (~10 min live + ~10 min Q&A)

With the longer slot you can show — not just narrate — the real anchors and both personas.

| Time | Beat | Screen | Live proof to point at |
|---|---|---|---|
| 0:00–0:30 | One front door, two ways in | `/` | The single choice |
| 0:30–1:30 | **Singpass + MyInfo consent** | `/consent` | 🟢 Real sandbox consent screen — "this is how 0 forms is literally true" |
| 1:30–3:00 | A conversation, not a form | `/chat` | Living Care Profile assembling; income field came from MyInfo, not chat |
| 3:00–4:00 | Not a list, a plan | `/pathway` | Why-this-for-you tags traced to real facts |
| 4:00–6:00 | **Autopilot** | `/autopilot` | Draft-then-confirm → **Approve all** → 🟢 **real WhatsApp lands on a phone** + 🟢 **real Google Calendar invite**; Guardian shield on top |
| 6:00–7:00 | Warm handover | `/handover` | Care Brief preloaded for Aunty Mei |
| 7:00–9:00 | **Same engine, different plan** | re-run as Mr Lim | Silver Support, AAC elevated, weekly check-in, WhatsApp to London |
| 9:00–10:00 | Close | (deck) | 1 front door · 5 services under one Guardian · 0 forms |

**Q&A-ready (have these answers loaded — see source-of-truth §6a/§6b/§6c + slide-fixes Q&A):**
- *Real or simulated?* → orchestration live; WhatsApp + Calendar + Singpass/MyInfo real; AIC/ICCP/polyclinic simulated against real interfaces (partnership, not engineering).
- *Zero forms with NRIC + income?* → Singpass login + MyInfo-on-consent.
- *Whose Singpass for a caregiver?* → delegation; senior consents once at onboarding.
- *Autopilot acting without permission?* → draft-then-confirm; only human-escalation bypasses confirm.
- *Non-English speakers?* → multilingual is config, not re-engineering (LLM conversation + structured profile + per-template WhatsApp language codes).

---

*Anchored to `product-source-of-truth.md` and `slide-fixes.md`. If product intent changes, update
those first, then mirror the change here.*
