# CareKaki — Use Cases & User Flows (Build Guide)

> **Use-case-first.** Each entry starts from a real situation a person shows up with (the
> "job to be done"), then the **flow** is *how they tackle it in the app*. Every step maps to a
> **screen**, the **service / API** behind it, and whether each integration is **REAL** or
> **SIMULATED**. Derived from `product-source-of-truth.md` and `slide-fixes.md` (canonical spec).
>
> Structure: **§1 legend → §2 the screens (shared building blocks) → §3 flagship use cases
> (end-to-end) → §4 building-block use cases → §5 extra use cases (strengthen the pitch) →
> §6 divergence → §7 build-gap analysis → §8 demo run-of-show.**

---

## 0. Decisions locked

| Decision | Resolution |
|---|---|
| Consent placement | Singpass/MyInfo is a **gate after landing, before conversation**. |
| Caregiver delegation | **Mdm Tan (senior) consents**; **Wei Ling acts on her behalf** (§6c). |
| Medication review | **Pathway-only**; Autopilot stays at the **canonical 5 services**. |
| Warm handover | **Dedicated Care Brief finale screen** ("what Aunty Mei sees"). |
| Persona ↔ mode | **Bound:** caregiver = Mdm Tan, self = Mr Lim. |
| LLM | Model-agnostic in flows. **Target = Claude Sonnet 4.6 via Vertex AI**; **current = Gemini**. |

**Build note (LLM drift):** `backend/main.py` currently calls Gemini; design spec §3 specifies
Claude Sonnet 4.6. Target route = Claude on **Vertex AI** (bills through GCP, covered by the $300
trial credit; demo token cost is negligible). Flows do not depend on the model choice.

---

## 1. Integration legend (§6a: anchor real, simulate the rest — never substitute)

| Tag | Meaning | Members |
|---|---|---|
| 🟢 **REAL** | Genuinely live in the demo | **WhatsApp** (Meta Business Cloud API), **Singpass + MyInfo** (official **sandbox**), **Google Calendar** |
| 🟡 **SIM** | Simulated against the agency's real interface (partnership/data-governance gated, not engineering) | **AIC**, **Home Nursing** (HNF/NTUC), **ICCP / Care Corner**, **polyclinic / medication** |
| ⚙️ **ORCH** | Always real — fan-out, async state, status progression | Autopilot Orchestrator |
| 🛡️ **GUARD** | Cross-cutting Responsible-AI layer (wraps everything) | Guardian service |

---

## 2. The screens (shared building blocks)

Every use case is built from these few screens/capabilities. Defined once here so each flow below
can just name the screen instead of repeating the plumbing.

| Screen | What it does | Route | Service / API | Integration |
|---|---|---|---|---|
| **Landing** | Mode select ("Who is this for?") | `/` | routes to `/chat?mode=self\|caregiver` | — |
| **Consent** | Singpass login + MyInfo consent | **new** `/consent` | `web → agent /auth/singpass` (OIDC) → `/myinfo/consent` → signed fields seed profile | 🟢 Singpass/MyInfo (sandbox) |
| **Conversation** | Chat + Living Care Profile | `/chat` | `agent /conversation` → SSE `{reply, profile_patch}` | LLM · 🟢 MyInfo fields · 🛡️ |
| **Pathway** | 4-column plan with why-tags | `/pathway` | `agent /pathway` from session profile; provenance per item | 🟡 named services · 🛡️ |
| **Autopilot** | 5 services, draft-then-confirm | `/autopilot` (Guardian shield bar) | `agent /autopilot/draft` → approve → `/autopilot/confirm` → SSE `service_update` | ⚙️ + 🟢/🟡 per service · 🛡️ |
| **Care Brief** | Warm handover artifact | **new** `/handover` | `agent /handover` → structured Care Brief | 🟡 ICCP/Care Corner |
| **Guardian** | Cross-cutting safety layer (every screen) | shield/banner | separate `guardian` service: PDPA scrub · no-medical-advice · trace · escalate | 🛡️ |
| **WhatsApp** | Notification adapter (fires from Autopilot) | — | `agent` → WhatsApp Business Cloud API (swappable adapter) | 🟢 WhatsApp |

### The 5 services inside Autopilot (+ Guardian wrapper)

| # | Service | Provider | Integration |
|---|---|---|---|
| 1 | Financial — **Home Caregiving Grant** | AIC | 🟡 SIM (filed with 🟢 MyInfo NRIC/income) |
| 2 | Clinical — **Home nurse visit** | HNF / NTUC Health | 🟡 SIM booking **+ 🟢 Google Calendar invite** |
| 3 | Social — **Active Ageing Centre enrolment** | AAC | 🟡 SIM |
| 4 | Coordination — **Care Corner / ICCP warm handover** ⭐ | ICCP / Care Corner | 🟡 SIM (may bypass confirm to escalate to a human faster) |
| 5 | Comms — **WhatsApp to family** | Meta WhatsApp | 🟢 REAL |
| — | **Guardian** (wrapper, not a tile) | — | 🛡️ shield bar on top |

**Draft-then-confirm:** Autopilot prepares all 5 as drafts → user approves per-service or
**Approve all** → statuses progress via SSE. Only the ICCP **human escalation** may bypass confirm.

---

## 3. Flagship use cases (end-to-end — these are the demo)

### UC-1 — "My mum was just discharged and I don't know where to start"
- **Actor / mode:** Wei Ling (daughter), **caregiver mode**. She types; her mum **Mdm Tan, 78** consented at onboarding.
- **Trigger:** Mdm Tan fell, discharged from SGH this morning, lives alone. Wei Ling works full-time + 2 kids, overwhelmed.
- **Goal:** Turn chaos into one actionable plan — and have the app *do* the legwork.
- **Flow:**
  1. Picks "For someone I care for." — *Landing* · routes `/chat?mode=caregiver` · —
  2. Logs in with **Mdm Tan's Singpass**; approves MyInfo (NRIC, DOB, address, income, CPF); consent records Wei Ling may act on her behalf. — *Consent* · `/auth/singpass`+`/myinfo/consent` · 🟢
  3. Talks: "Mum, 78, fell, discharged today, lives alone… she needs a walker, I work full-time." Living Care Profile fills in real time; **financial tier comes from MyInfo, not the chat.** — *Conversation* · `/conversation` (SSE) · LLM + 🟢 + 🛡️
  4. Reviews the pathway: This Week (home safety, walker + grab-bars) · Weeks 2–8 (home nursing, **physio/rehab at SACH**, medication review) · Apply Now (**Home Caregiving Grant**) · Single Point (ICCP, monthly check-in). Each carries a why-tag ("Lives alone post-discharge"). — *Pathway* · `/pathway` · 🟡 + 🛡️
  5. Taps "Launch Autopilot" → reviews 5 drafts → **Approve all**: HCG filed w/ MyInfo docs (🟡+🟢) · home nurse Tue 9am **+ Google Calendar invite (🟢)** · AAC (🟡) · **ICCP routed to Aunty Mei** (🟡) · **WhatsApp to Wei Ling (🟢)**. — *Autopilot* · `/autopilot/draft`+`/confirm` (SSE) · ⚙️+🛡️
  6. Sees the **Care Brief** that Aunty Mei will receive (profile + actions + consents + contact = Wei Ling). — *Care Brief* · `/handover` · 🟡
- **Outcome:** A working plan, a real WhatsApp + real calendar invite landed, a coordinator briefed. *"When Aunty Mei calls tomorrow, Wei Ling never repeats herself."*
- **Why it helps our case:** the canonical "navigation shortage → one plan, zero forms, the agent does the work" story end-to-end.
- **Demo:** shown live (primary).

### UC-2 — "I had a fall and I'm managing on my own — my kids are overseas"
- **Actor / mode:** **Mr Lim, 72**, **self mode**. **He opens the app and types himself.** His daughter in **London** is a **notified family member, not the operator** (§5 persona fix).
- **Trigger:** Same fall + discharge as Mdm Tan, but no family in the room. Real risk = **loneliness**.
- **Goal:** Get set up safely on his own, and keep his overseas daughter in the loop.
- **Flow:** (same screens as UC-1, different result)
  1. Picks "For myself." — *Landing* · `/chat?mode=self` · —
  2. **Mr Lim consents for himself** via Singpass/MyInfo; income/CPF → **pension/Silver Support tier**. — *Consent* · `/auth/singpass`+`/myinfo/consent` · 🟢
  3. Talks in first person; profile flags **no local caregiver, family overseas → loneliness risk**; records daughter's contact as a **notified family member**. — *Conversation* · `/conversation` · LLM + 🟢 + 🛡️
  4. Pathway diverges: Apply Now = **Silver Support** (not HCG) · Single Point = **weekly check-in** · social = **AAC elevated**. Why-tags: "Lives alone, family overseas." — *Pathway* · `/pathway` · 🟡 + 🛡️
  5. Autopilot, re-weighted: Silver Support (🟡+🟢) · home nurse **+ calendar (🟢)** · **AAC elevated (🟡)** · ICCP with **weekly cadence** (🟡) · **WhatsApp to the daughter in London (🟢)**. — *Autopilot* · `/autopilot/*` · ⚙️+🛡️
  6. Care Brief notes weekly cadence + overseas family contact. — *Care Brief* · `/handover` · 🟡
- **Outcome:** Same intent, **different plan** — proof CareKaki *reads the room* on one engine.
- **Why it helps our case:** the "same engine, different person" differentiator; whole-person (social) care, not just medical.
- **Demo:** shown live (primary, run after UC-1 as the contrast beat).

---

## 4. Building-block use cases (the jobs that chain into the flagships)

These reuse the same screens/engine; each can stand alone or appear inside UC-1/UC-2.

### UC-3 — "What financial help do I actually qualify for?"
- **Actor:** either mode. **Goal:** stop guessing at schemes; get matched + filed without a form.
- **Flow:** Singpass/MyInfo brings verified income/CPF (*Consent*, 🟢) → profile derives **financial tier** (*Conversation*) → pathway "Apply Now" lists only what they qualify for with why-tags (*Pathway*) → Autopilot **files the grant** (HCG or Silver Support) using MyInfo docs (*Autopilot* service 1, 🟡+🟢).
- **Why it helps:** the literal proof of **"0 forms"** + means-tested data from the national source. Strongest answer to "how is it zero forms if you filed a grant?"
- **Demo:** shown live (inside UC-1/UC-2); callable as its own talking point.

### UC-4 — "I need to arrange care at home"
- **Actor:** either mode. **Goal:** book ongoing clinical care without phone-tag across agencies.
- **Flow:** pathway Weeks 2–8 surfaces home nursing + physio/rehab at SACH (*Pathway*) → Autopilot books the **home nurse (HNF/NTUC, 🟡)** and drops a **real Google Calendar invite (🟢)** with lift access + caregiver contact (*Autopilot* service 2).
- **Why it helps:** a **real artifact** (calendar invite) proves the orchestration reaches the outside world; clinical-care coverage.
- **Demo:** shown live (the calendar invite is a real anchor).

### UC-5 — "I'm worried about being alone / isolated"
- **Actor:** self mode esp. (Mr Lim). **Goal:** address loneliness, not just medical needs.
- **Flow:** conversation surfaces isolation (*Conversation*) → Guardian-traced why-tag "no family in the room" → Autopilot **AAC enrolment (🟡)** elevated + **weekly check-in** cadence in the Care Brief (*Autopilot* service 3, *Care Brief*).
- **Why it helps:** **whole-person / social care** is what makes CareKaki more than a medical directory; the divergence engine for UC-2.
- **Demo:** shown live (inside UC-2).

### UC-6 — "This is too much — I want a real person to take over"
- **Actor:** either mode. **Goal:** hand off to a human who already has the full picture.
- **Flow:** "one click to human" available on every screen (*Guardian*) → Autopilot routes to **least-loaded ICCP officer (Aunty Mei)** with **Care Brief preloaded** (*Autopilot* service 4, 🟡) → the *Care Brief* screen shows the brief. This is the **one action that may bypass confirm** (escalate faster).
- **Why it helps:** the **warm handover** differentiator + Responsible-AI human-in-the-loop; Care Corner (the partner) is the entity that switches this on.
- **Demo:** shown live (the hero/finale).

### UC-7 — "Keep my family in the loop"
- **Actor:** either mode. **Goal:** family stays informed without the user re-explaining.
- **Flow:** caregiver/family contact captured at consent/conversation → Autopilot sends a **plain-language WhatsApp summary + reassurance thread (🟢)** to Wei Ling (UC-1) or the **daughter in London** (UC-2) (*Autopilot* service 5, via the *WhatsApp* adapter).
- **Why it helps:** the **single genuinely-live integration** (real message, real phone); WhatsApp as a **swappable adapter** (SMS/email/Telegram later) is the scaling answer.
- **Demo:** shown live (real WhatsApp lands).

---

## 5. Extra use cases (added to strengthen the pitch & Q&A)

These map directly to the scoring criteria (Responsible AI, client-profile understanding, "not a
directory") and to likely judge questions. Most are **Q&A / roadmap**, not core demo beats — flagged.

### UC-8 — "Is this dangerous? Should I change her medication?" (clinical question)
- **Goal:** the user asks something medical. **Flow:** Guardian **intercepts** the clinical question on the conversation stream (*Guardian* principle 1), **does not answer**, and routes to a human + offers the coordinator path (UC-6). — *Conversation* · `/conversation` → `guardian` classifier · 🛡️
- **Why it helps:** live proof that **"no medical advice" is architectural, not a prompt** — and `guardian` is a real, separately-callable service (can demo it rejecting a medical payload in Q&A).
- **Demo:** **Q&A demo** (call Guardian directly to show the rejection).

### UC-9 — "I'm more comfortable in Mandarin / Malay / Tamil"
- **Goal:** non-English speaker navigates in their language. **Flow:** conversation runs in-language (LLM, *Conversation*); profile stays **structured/language-independent**; MyInfo can carry preferred language; WhatsApp templates per language code (*WhatsApp*). — same screens, no re-engineering.
- **Why it helps:** **multilingual is config, not a bolt-on** — directly answers the inclusivity question without over-claiming (demo stays English).
- **Demo:** **Q&A** (architecture answer; soften any hard "languages" claim per slide-fixes §9).

### UC-10 — "What happens to my NRIC and income data?"
- **Goal:** user worries about privacy. **Flow:** consent screen lists **exactly** the MyInfo fields requested (*Consent*); Guardian **tokenises NRIC/income at ingest**, PII never leaves the regional boundary, redaction before logging (*Guardian* principle 2). — *Consent* + cross-cutting · 🟢 + 🛡️
- **Why it helps:** **PDPA-aware by default**; trust is a feature. Pairs with the delegation answer.
- **Demo:** **Q&A / shown at consent** (point at the explicit field list).

### UC-11 — "My situation changed" (re-discharge, condition worsens, new info)
- **Goal:** plan must update as life changes. **Flow:** user adds info in chat → **Living Care Profile updates** (*Conversation*) → pathway **re-reasons** (*Pathway*) → Autopilot drafts new/changed actions for approval (*Autopilot*).
- **Why it helps:** proves it's a **Living** profile + an agent that re-plans — **not a one-shot form or a static directory.**
- **Demo:** **Q&A / optional live** (add a fact, show the profile + plan shift).

### UC-12 — "I'm a Care Corner coordinator — a handover just landed" (the partner side)
- **Actor:** **Aunty Mei (ICCP coordinator)** — the *receiving* side. **Goal:** pick up a case already fully briefed.
- **Flow:** Autopilot routes the case (UC-6) → coordinator opens the **inbound Care Brief**: profile, pathway, actions taken, consents, family contact, cadence. — coordinator view of the *Care Brief* · `agent /handover` · 🟡
- **Why it helps:** shows the **two-sided value** and why **Care Corner (in the room) is the partner that switches ICCP routing on**; "the family never repeats themselves" from the coordinator's POV.
- **Demo:** **Q&A / roadmap** (coordinator UI is not built — see gaps). Powerful to *describe* with the partner present.

### UC-13 — "I started earlier and came back" (resume)
- **Goal:** continuity across visits/devices. **Flow:** server-side session keyed by cookie restores profile + plan (design spec §4). — cross-cutting.
- **Why it helps:** supports the **stateless-services-with-session-store** cloud-native story.
- **Demo:** roadmap (in-memory session is demo-grade; persistence is post-demo).

---

## 6. Divergence at a glance (same engine — §5)

| Dimension | Caregiver — **Mdm Tan (UC-1)** | Self — **Mr Lim (UC-2)** |
|---|---|---|
| Operator | Wei Ling (local) | Mr Lim himself |
| Notified family | Wei Ling | Daughter in London |
| Singpass | Mdm Tan consents; Wei Ling acts on behalf | Mr Lim consents for himself |
| Finance | Home Caregiving Grant | Silver Support |
| Social | AAC secondary (family present) | **AAC elevated** (loneliness) |
| Check-ins | Single coordinator callback | **Weekly** |
| WhatsApp | To Wei Ling | To daughter in London |

---

## 7. Build-gap analysis (per screen — use cases inherit these)

Legend: ✅ built · 🟨 mocked/partial · ❌ missing.

| Screen | Status | Today | Mocked | Missing |
|---|---|---|---|---|
| **Landing** | ✅/🟨 | `/` + `ModeCard`, `?mode=` query | — | mode is a **label only** — doesn't yet fork seeding/tone/notifications |
| **Consent** | ❌ | — | — | **entire screen** — no `/consent`, no `/auth`/`/myinfo`, no sandbox, no delegation |
| **Conversation** | 🟨 | `/chat`, `useChatState`→`POST /chat`, live profile panel | **Mdm Tan mock pre-seeded**; transcript from `mockMessages` | MyInfo seeding; **Guardian**; **server session** (uses `sessionStorage`); **Mr Lim seed**; **SSE** (single JSON now); Claude swap |
| **Pathway** | 🟨 | `/pathway` → `POST /pathway` (Gemini); SACH naming fixed | falls back to `mockCareProfile`; why-tags in `mock-data.ts` | server session; Guardian provenance |
| **Autopilot** | 🟨 | `/autopilot` + dashboard; now **5 services + Guardian shield bar** (AAC added, medication moved to pathway, "five services" copy) | **static** `mockAutopilotServices` | **no backend**; **no draft-then-confirm**; no SSE; **real WhatsApp/Calendar/AIC/ICCP wiring absent** (cards present, integrations not live) |
| **Care Brief** | ❌ | — | — | **entire screen** — no `/handover` screen/endpoint |
| **Guardian** | ❌ | — | — | **no `guardian` service**; no medical-advice intercept (UC-8), PDPA tokenisation (UC-10), provenance, escalation |
| **WhatsApp** | ❌ | — | — | no WhatsApp Business integration; no adapter abstraction |
| Cross-cutting | ❌ | — | — | k8s manifests (`/k8s`); coordinator view (UC-12); persistence (UC-13); genuine mode fork |

**Reading:** Landing/Conversation/Pathway exist as a single-shot, Gemini, mock-seeded skeleton. The
highest-leverage beats — **Consent, Autopilot (draft-then-confirm + real WhatsApp/Calendar), Care
Brief, and Guardian** — are essentially greenfield. UC-3–7 depend on Autopilot/Care Brief; UC-8/10
depend on Guardian; UC-12 needs a coordinator view.

### Quick fixes — ✅ applied
- `lib/mock-data.ts`: renamed "Physio at SACH polyclinic" → "Physio/rehab at SACH"; dropped "Polyclinic SACH" provider.
- `lib/mock-data.ts`: Autopilot now the **canonical 5** (HCG, home nurse, **AAC**, Care Corner/ICCP, WhatsApp); **medication removed** (pathway-only); HCG copy reconciled to **MyInfo, no form**; home-nurse copy notes **Google Calendar invite**.
- `components/autopilot/AutopilotDashboard.tsx`: **Guardian moved out of the grid into a shield bar** wrapping all services; "six services" → **"five services"**.
- *Still display-only:* the 🟢 WhatsApp / Google Calendar and 🟡 AIC/ICCP integrations are represented as cards but not yet wired to live/simulated backends.

---

## 8. Demo run-of-show (~10 min live + ~10 min Q&A)

| Time | Beat | Use case | Screen | Live proof |
|---|---|---|---|---|
| 0:00–0:30 | One front door | UC-1 start | Landing | the single choice |
| 0:30–1:30 | **Consent** | UC-3 / UC-10 | Consent | 🟢 real sandbox consent; "this is how 0 forms is literally true" |
| 1:30–3:00 | A conversation, not a form | UC-1 | Conversation | profile assembling; income from MyInfo |
| 3:00–4:00 | Not a list, a plan | UC-1 | Pathway | why-tags traced to facts |
| 4:00–6:00 | **Autopilot** | UC-3/4/7 | Autopilot | draft → **Approve all** → 🟢 **real WhatsApp** + 🟢 **real Calendar invite**; Guardian shield |
| 6:00–7:00 | Warm handover | UC-6 | Care Brief | Care Brief preloaded for Aunty Mei |
| 7:00–9:00 | Same engine, different plan | UC-2 (+UC-5) | re-run as Mr Lim | Silver Support, AAC elevated, weekly, WhatsApp to London |
| 9:00–10:00 | Close | — | (deck) | 1 front door · 5 services under one Guardian · 0 forms |

**Q&A ammo (load these):** UC-8 (call Guardian live to reject a medical question) · UC-9 (multilingual = config) · UC-10 (PDPA/consent transparency) · UC-11 (Living profile re-plans) · UC-12 (coordinator side / why Care Corner is the partner) · real-vs-simulated framing (§1).

---

*Anchored to `product-source-of-truth.md` and `slide-fixes.md`. If product intent changes, update
those first, then mirror the change here.*
