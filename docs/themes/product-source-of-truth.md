# CareKaki — Product Source of Truth

> **This document is the absolute source of truth for the CareKaki project.**
> It captures *what we are building and why*, derived from the actual running prototype.
> When in doubt about product intent, scope, tone, or narrative — defer to this file.

**Project:** CareKaki — an agentic Care Navigator
**Partner:** Care Corner Singapore (an ICCP provider)
**Event:** Dell InnovateDash 2026 — SUTD
**Tagline:** *"Your care buddy that knows where to start."*

---

## 1. The one-sentence pitch

CareKaki is an **agentic Care Navigator that turns Singapore's fragmented community-care
system into a single, personalised plan — built through conversation, not forms.**

It is **not** a directory. **Not** a chatbot. It is an agent that **listens, reasons, and
operates the system on the family's behalf** — so the people who need care don't have to
navigate a system to receive it.

---

## 2. The core insight (the thesis everything hangs on)

> **Singapore doesn't have a care shortage. It has a navigation shortage.**

World-class community care already exists. But the moment a senior is discharged, families
collide with a maze of agencies, schemes, and acronyms (AIC, ICCP, SMF, MediFund, HCG,
Silver Support, AAC, CHAS, PCP, Discharge…).

People don't fail because help doesn't exist. **They fail because no one helps them figure
out what's right for their situation.**

> *"The system isn't broken. It's invisible."*
> — A caregiver, in their fourth phone call of the morning.

**The product's entire job is to make the invisible system reachable.**

---

## 3. The product in one line

**One front door. Two ways in.**

- **1 front door** — a single starting question.
- **5 services** — orchestrated in the background, **all under one Guardian** (Guardian is
  the *wrapper/safety layer*, not a service tile).
- **0 forms** — nothing is ever filled in by hand, because the care profile is built
  entirely through conversation (LLM extraction from natural language). In production,
  Singpass/MyInfo would additionally verify identity and income data.

---

## 4. The demo beats (the heart of the product)

These moments are where the product is *understood*. **Conversation and Autopilot are the
beats that make people "get it" — they carry the most weight.**

### Beat 1 — One front door, two ways in (Landing)

The only choice we ever ask on day one: **"Who is this for?"**

- **For myself** — a senior figuring things out (discharge, schemes, day-to-day support).
- **For someone I care for** — a caregiver who needs a plan they can actually act on.

Everything after this adapts to that single answer. **The two modes are genuinely distinct**
— different greeting, different tone, different adapters, different Audio Guide narration.

Below the two cards: **"Sign in with existing account"** — leads to a Netflix-style profile
picker with 4 pre-seeded demo users, each showcasing different scenarios and locations.

### Beat 2 — A conversation, not a form (Living Care Profile) ⭐

The hero moment. The user simply **talks**; there are no forms or dropdowns.

As they talk, CareKaki assembles a **Living Care Profile** in real time on the right — name,
age, living situation, mobility, conditions, caregiver context, financial tier, recent event.

**Every field is extracted from natural conversation by the LLM (GPT-4o-mini, JSON mode).
No form is ever filled.** A few turns in, CareKaki already has enough to act.

**Audio Guide:** When enabled, ElevenLabs narrates what's happening ("I've noted that,
updating the profile now"). The mic button lets the user speak instead of type — speech
goes through browser Speech Recognition and is sent as a chat message to the LLM.

**Emergency detection:** If the user's message contains emergency keywords (fell, collapsed,
chest pain, seizure, not breathing, etc.), the system detects it instantly (no LLM call),
selects the appropriate adapters, and redirects straight to Autopilot — skipping the
pathway and review steps.

### Beat 3 — Not a list. A plan. (Pathway) ⭐

From the profile, CareKaki generates a **personalised pathway** via GPT-4o-mini (JSON mode)
— grouped by *what needs to happen when*, not a flat list:

- **This Week** — get home safely.
- **Weeks 2–8** — ongoing care.
- **Apply Now** — financial support the family qualifies for.
- **Single Point** — one coordinator to pull it all together.

**Every recommendation explains itself** with a *"Why this for you"* tag traced to a real
profile fact (e.g. "Lives alone post-discharge", "Income within tier").

**Editable:** A side chat panel lets the user say "remove the nursing visit, I'll handle
that myself" — the LLM regenerates the plan with the change. Human-in-the-loop, before
anything runs. With Audio Guide on, the voice acknowledges edits ("Got it, updating the
plan") and confirms completion ("Done, plan refreshed").

### Beat 4 — Autopilot: the agent does the work ⭐⭐

The signature moment.

> A normal AI tool generates a checklist for *someone else* to go and do.
> **Autopilot just does it** — five services, in parallel, right now, **all under one Guardian**.

**The five services (all running against real data or real messaging channels):**

1. **Caregiver Alert (Telegram)** — pushes emergency alert to the caregiver's Telegram DM
   with one-tap response buttons: *I'm going now · Call ambulance · Ask neighbor · Escalate*.
   Free-text replies are classified by the LLM (intent, status, ETA, urgency).
2. **ICCP Coordinator (Telegram)** — assembles a case packet, sends it to a coordinator
   Telegram group with accept/escalate/request-info buttons. All interactions logged for the
   Care Brief.
3. **AIC Eldercare Services** — searches 140 Senior Activity Centres from real data.gov.sg
   GeoJSON. Scored by keyword relevance + haversine distance. Rendered on a Leaflet +
   OpenStreetMap map with numbered markers and fullscreen mode.
4. **HomeNursing.sg** — searches CHAS clinics from real data.gov.sg GeoJSON. Extracts clinic
   name, phone, programmes (CDMP/CHAS/ISP). Generates simulated availability slots.
5. **Medication Review** — extracts medication names, searches HSA Registered Therapeutic
   Products CSV, enriches with openFDA drug label API (warnings, precautions, adverse
   reactions). Rule-based risk classification (age, symptoms, forensic classification).
   Routes formatted review packet to pharmacy desk on Telegram with accept/reject buttons.

**Guardian wraps all five** — shown as a band across the top. PDPA redaction, no-medical-advice
classifier, human gate, traceability tags on every panel.

**Dynamic adapter selection:** Not all 5 always run. The system selects adapters based on the
situation:
- Fall/collapse → ICCP, AIC, Telegram
- Medication concern → Medication, Telegram
- Chest pain/stroke → ICCP, Telegram
- Nursing/wound/rehab → Nursing, ICCP
- No match → all 5

Fewer adapters = wider panels (CSS flex-1). Different users see different autopilot layouts.

**Consent model — draft-then-approve:** Autopilot *prepares* every action; the user approves
before anything irreversible runs. Three panels (ICCP, Nursing, Medication) show an "Approval
Required" overlay. Two (AIC search, Telegram alert) auto-run because they're read-only. Only
human-escalation bypasses confirmation.

**Audio Guide on Autopilot:** Before approval, the voice explains what will happen ("I'm
planning three things..."). After approval: "Okay, working on it now." Voice input on this
page can say "approve" to trigger the approval button.

### Beat 5 — Care Brief: the warm handover

The Care Brief is generated live from the in-memory logs (`telegram_log`, `iccp_log`,
`medication_log`). It shows:

- **Situation** — the patient's context in plain words.
- **Actions taken by CareKaki** — pulled from real adapter logs: "Caregiver alerted via
  Telegram," "Medication review sent to Pharmacy Desk," "ICCP case packet assembled."
- **Recommended next steps** — generated based on what happened (e.g. "Follow up with
  pharmacy desk," "Confirm caregiver availability," "Schedule check-in within 48 hours").
- **Important notes** — contextual warnings (age ≥ 75 flag, blood thinner flag).
- **Guardian footer** — "Guardian-checked · PDPA scrubbed · no medical advice given."

When the coordinator picks up, they already know everything. The family never repeats themselves.

---

## 5. "Reads the room" — same engine, different plan

The proof that CareKaki *reasons* rather than templates: **same engine, different person.**

**Four demo users, each in a different part of Singapore:**

| User | Role | Location | Adapters | Scenario |
|------|------|----------|----------|----------|
| **Mdm Tan, 78** | Senior | Ang Mo Kio | ICCP, AIC, Telegram | Fall + coordinator escalation |
| **Mr Lim, 72** | Senior | Toa Payoh | AIC, Nursing, ICCP, Telegram | Fall + loneliness, family overseas |
| **Mrs Wong** | Caregiver | Jurong East | Nursing, AIC, ICCP | Post-surgery, needs home nursing |
| **Uncle Raj, 85** | Senior | Yishun | ALL 5 | Full emergency — collapsed, heart failure, warfarin |

Different locations = different AIC/nursing results. Different conditions = different adapters
activated. Different caregiver situations = different notification flows.

> **Same intent. Different context. CareKaki reads the room.**

---

## 6. Architecture

### What's actually built (the running prototype)

```
Frontend: Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Leaflet/react-leaflet
Backend:  FastAPI (Python) — one modular monolith, ~830 lines
LLM:      OpenAI GPT-4o-mini (chat, extraction, pathway, voice scripts)
Voice:    ElevenLabs (TTS) + browser Web Speech API (STT)
Messaging: Telegram Bot API (2 bots: CareBridge caregiver + ICCP coordinator)
Maps:     Leaflet + OpenStreetMap (free, no API key)
Data:     CHAS Clinics GeoJSON · Eldercare Services GeoJSON · HSA CSV · openFDA API
Infra:    Docker Compose (web + backend + ngrok) · ngrok tunnel for Telegram webhooks
```

### Target architecture (what slides show)

```
CLIENT SURFACES   Web app · Mobile PWA · WhatsApp bot
        │
API GATEWAY       OAuth + role-based auth · rate limiting · PDPA scrub · request tracing
        │
MICROSERVICES     Conversation · Profile Builder · Pathway Reasoner · Autopilot Orchestrator · Handover
        │
AGENT PLANE       LLM (reasoning + tool-use)  ·  Guardian (safety + PDPA + escalation)
        │
IDENTITY/DATA     Singpass (login) · MyInfo (verified data on consent)
INTEGRATIONS      AIC API · Home Nursing · ICCP coordinator · WhatsApp Business · Google Calendar
```

### Why the gap is intentional

The prototype validates **core flows** (conversation → profile → pathway → autopilot → brief)
in a modular monolith. Each adapter is a separate Python module in `services/`. Splitting into
microservices is a **deployment decision, not a code rewrite**. The architecture is designed for
K8s; the MVP runs on Docker Compose because that's what ships in hackathon time.

Key divergences from target and their justifications:

| Target | Prototype | Why |
|--------|-----------|-----|
| WhatsApp Business API | Telegram Bot API | Telegram has instant bot creation; WhatsApp requires Meta business verification. Same adapter interface. |
| Singpass/MyInfo | Consent UI mockup | Government sandbox access requires approval. Integration point is designed. |
| Google Calendar | Not built | Time constraint. Would be a simple API call from the nursing adapter. |
| 5 microservices on K8s | 1 FastAPI monolith on Docker Compose | Faster iteration. Modular code structure supports future split. |
| Supabase (Postgres) | In-memory Python state | No network dependency = zero risk during live demo. Clean restart = clean demo. |
| Claude/Gemini | OpenAI GPT-4o-mini | Migrated from Gemini (5 req/min free tier limit). GPT-4o-mini is fast, cheap, reliable. |

---

## 6a. Data sources — real Singapore government data

CareKaki's adapters run against **real datasets**, not mocked data:

- **Eldercare Services GeoJSON** (data.gov.sg) — 140 Senior Activity Centres with coordinates,
  addresses, postal codes. HTML tables inside GeoJSON features, parsed with regex extraction.
- **CHAS Clinics GeoJSON** (data.gov.sg) — hundreds of CHAS clinics with name, phone, programme
  codes (CDMP/CHAS/ISP), building, floor/unit.
- **HSA Registered Therapeutic Products CSV** (data.gov.sg) — every registered drug in Singapore.
  Product name, active ingredients, forensic classification, dosage form, manufacturer.
- **openFDA drug label API** (US FDA) — public drug label warnings, precautions, adverse
  reactions. Secondary enrichment layer, not primary dataset.

The scoring algorithm for AIC and Nursing adapters:
1. Parse HTML description field from GeoJSON features
2. Classify care need into keywords
3. Score each service: `keyword_matches × 10 + senior_keyword_bonus × 3`
4. If location provided: `distance_score = max(0, 30 - distance_km × 3)` (haversine)
5. Total = match_score + distance_score, sorted descending

**No LLM involved in adapter scoring.** Pure data + rules + math.

---

## 6b. Messaging — Telegram (production target: WhatsApp)

The prototype uses **Telegram** because it has instant bot creation (BotFather → token → done).
Two bots:

- **CareBridge bot** — caregiver DMs. Receives `/start` to register `chat_id`. Sends emergency
  alerts with inline buttons. Classifies free-text replies via GPT-4o-mini.
- **ICCP bot** — coordinator group. Receives `/coordinator` to register group `chat_id`. Sends
  case handover packets and medication review packets. Both use inline buttons (Accept/Escalate/
  Request More Info).

Both bots share one ngrok tunnel. Webhooks: `/telegram/webhook` and `/iccp/webhook`.

**The adapter interface is identical** to what WhatsApp would use: message + buttons + webhook
callback. When WhatsApp Business API access is approved, the same flow plugs in. Telegram was
chosen for demo reliability, not as a permanent channel decision.

---

## 6c. Identity & data — production roadmap

The prototype builds the care profile entirely through **LLM conversation extraction**. The
consent screen exists as a UI mockup showing what Singpass/MyInfo integration would look like.

**Production path:** Singpass login (OpenID Connect) + MyInfo-on-consent brings in verified
NRIC, DOB, address, income (IRAS), CPF. The profile fields map 1:1 to MyInfo's schema. The
integration point is designed; sandbox access is the production step.

---

## 7. Guardian — Responsible AI as a service (not a slogan)

> **Safety is an architectural choice, not a prompt instruction.**

Guardian is a **real, separately callable safety service** (`backend/services/guardian.py`).
It is deterministic (rule-based), not probabilistic. It wraps the live `/chat` path — every
LLM reply passes through `guardian_check` before reaching the user.

**Independently callable:** `POST /guardian/check` — judges can call it live during Q&A.

Four implemented principles:

1. **PDPA redaction** — regex catches Singapore NRIC (S/T/F/G/M + 7 digits + letter), phone
   numbers (8-digit SG format), emails. Replaces with masked versions: `S1234567A` → `S****A`.
   Deterministic, every time.
2. **No medical advice** — scans for patterns: "take X mg", "prescribe", "diagnose", "stop
   taking", "increase dosage". Appends disclaimer if triggered. CareKaki never answers clinical
   questions — it routes to a human.
3. **Human gate** — detects risky actions (submit, book, apply, escalate, call 995, handover).
   Sets `requires_confirmation` flag. Autopilot panels with risky actions show "Approval
   Required" overlay.
4. **Traceability** — every decision tagged with adapter name, data sources, and timestamp.
   Panel headers show source labels (e.g. "HSA CSV · openFDA API").

**Not yet implemented (production roadmap):**
- Bias monitoring — log demographic assumptions for weekly review with Care Corner.
- Regional data residency verification.

---

## 8. Audio Guide — voice layer

An optional voice companion powered by **ElevenLabs** (text-to-speech) and **browser Web
Speech API** (speech-to-text).

### How it works
1. User clicks "Audio Guide" button in header → `guide_started` event
2. Backend: GPT-4o-mini generates a short spoken script (2-3 sentences, warm caregiver tone)
3. Script → ElevenLabs API → MP3 audio bytes
4. Frontend plays audio, shows status: Speaking / Listening / Ready / Paused

### Voice events (triggered at key moments)
| Event | When | What it says |
|-------|------|-------------|
| `guide_started` | Guide enabled | Welcome greeting |
| `tutorial_overview` | Tutorial page | Explains the full journey |
| `profile_updated` | Chat extracts a field | Brief acknowledgment |
| `care_plan_created` | Pathway loads | Casual plan summary |
| `care_plan_edit_*` | User edits plan | Short confirm/done |
| `autopilot_explanation` | Autopilot loads | Explains actions before approval |
| `autopilot_approved` | User approves | "Working on it now" |
| `care_brief_ready` | Care brief loads | Calm handover summary |
| `voice_input_*` | User speaks on any page | Contextual voice reply |

### Voice input by page
- **Chat:** Speech → sent as chat message → LLM responds
- **Pathway:** Speech → edits the care plan ("remove the nursing visit")
- **Autopilot:** Speech → can say "approve" to trigger approval
- **Care Brief:** Speech → contextual Q&A about the brief

### Anti-collision
- New `speak()` cancels any current audio (AbortController on fetch + audio.pause)
- 500ms debounce prevents rapid-fire from React re-renders
- Mic auto-mutes while AI is speaking
- Route changes stop all audio

### Voice personality
Warm, calm, middle-aged caregiver style. Simple language. Never diagnoses, prescribes, or
mentions technical terms (APIs, databases, adapters). Under 3-4 sentences per response.
Adjusts for senior users (extra simple and gentle).

---

## 9. What makes CareKaki different (five things, found together nowhere else)

1. **Living Care Profile** — built through conversation, never a form; it assembles itself as the family talks.
2. **Agentic Navigator** — reasons across schemes and services, not just retrieves them. A plan, not a search result.
3. **Why-this-for-you** — every recommendation explains itself in the family's own context, never generic copy.
4. **Warm Handover** — coordinators inherit the full Care Brief; families never repeat themselves on the next call.
5. **Responsible by design** — Guardian safety layer, no medical advice, PDPA-aware; a human is always one click away.

---

## 10. The vision

> **Excellent care already exists in Singapore. CareKaki is how families actually reach it.**
>
> Not a directory. Not a chatbot. An agent that listens, reasons, and operates the system on
> the family's behalf — so the people who need care don't have to navigate a system to
> receive it.

**1 front door · 5 services orchestrated (under one Guardian) · 0 forms to fill in.**

---

## 11. Voice & tone (how CareKaki should always feel)

- **Warm, human, reassuring** — it is a "care buddy," not a bureaucratic tool.
- **Plain language** — no jargon thrown at the family; acronyms are handled *for* them, never *at* them.
- **Confident but honest** — it acts decisively (Autopilot) yet always keeps a human reachable and never over-claims (no medical advice).
- **Personalised, never generic** — everything ties back to *this* family's actual context.
- **Audio Guide extends this** — the voice sounds like a calm care companion, not a robot or a formal doctor.

---

## 12. Tech stack summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16 + React 19 + Tailwind 4 | Modern SSR, fast iteration |
| Backend | FastAPI (Python) | Lightweight, async, perfect for LLM orchestration |
| LLM | OpenAI GPT-4o-mini | Fast, cheap, JSON-mode, reliable rate limits |
| Voice | ElevenLabs (TTS) + Web Speech API (STT) | Natural voice, browser-native mic |
| Messaging | Telegram Bot API (2 bots) | Instant bot creation, real webhooks |
| Maps | Leaflet + OpenStreetMap | Free, no API key |
| Data | SG open data (HSA, CHAS, Eldercare GeoJSON) + openFDA | Real government data |
| Infra | Docker Compose + ngrok | Containerised, webhook tunnel |

---

*This document reflects the actual running prototype as of 23 Jun 2026.
When any future work conflicts with the product intent captured here, this document wins
unless deliberately and explicitly revised.*
