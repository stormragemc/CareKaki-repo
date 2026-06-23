# CareKaki — Technical Brief for Hackathon Pitch

## 1. What CareKaki Is (One Sentence)

CareKaki is an AI-powered care coordination system that turns a conversation into a personalised care plan, then autonomously executes that plan — booking services, alerting caregivers, reviewing medications, and escalating to coordinators — while keeping a human in the loop at every step.

---

## 2. Technology Stack

### What We Use

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 16 + React 19 + Tailwind 4 | Modern SSR framework, fast iteration, responsive UI |
| **Backend** | FastAPI (Python) | Lightweight, async-capable, perfect for LLM orchestration |
| **LLM** | OpenAI GPT-4o-mini | Fast, cheap, JSON-mode for structured extraction |
| **Voice** | ElevenLabs (text-to-speech) + Web Speech API (speech-to-text) | Natural voice output, browser-native mic input |
| **Messaging** | Telegram Bot API | Real-time caregiver/coordinator alerts with inline buttons |
| **Maps** | Leaflet + OpenStreetMap | Free, no API key, works for Singapore |
| **Data** | Singapore open datasets (HSA, CHAS, Eldercare GeoJSON) | Real government data grounds every recommendation |
| **Drug Safety** | openFDA API | Public drug label warnings/precautions enrichment |

### What We Deliberately Chose NOT to Use (and Why)

| Original Plan | Why We Diverged | Hackathon Justification |
|--------------|----------------|------------------------|
| **Supabase (auth + database)** | 4 demo users don't need a database. In-memory state resets cleanly between demos. | No network dependency = zero risk of auth/DB failure during live demo. Supabase is the production target — the adapter interfaces are already structured for that migration. |
| **Docker + Kubernetes** | Added deployment complexity with no demo-day benefit. Judges can't see infrastructure. | `uvicorn + npm run dev` boots in 3 seconds. Docker exists for teammate deployment but isn't required. |
| **Microservices architecture** | One 800-line FastAPI monolith is faster to iterate on than 5 containers. | The code is already modular (services/*.py) — splitting into containers is a deployment decision, not an architecture change. |
| **Claude/Anthropic** | Gemini quota was 5 req/min; we migrated to OpenAI for reliable demo throughput. | GPT-4o-mini is cheap, fast, and has generous rate limits. Same prompts, same logic, different SDK. |
| **Singpass/MyInfo** | Government API access requires approval we couldn't get in hackathon time. | We built the consent UI and data flow as if MyInfo exists — the integration point is clearly marked. |
| **WhatsApp Business API** | Requires Meta business verification. Telegram has instant bot creation. | Telegram demonstrates the exact same flow (alert → buttons → reply → classification). |
| **RAG pipeline** | Our adapters already search real datasets. RAG would add latency for minimal demo benefit. | Keyword + distance scoring over real GeoJSON/CSV data IS a retrieval system — just not vector-based. |

---

## 3. System Architecture (How It Actually Works)

```
User (Web Browser)
    │
    ├── Chat Page ──────────── POST /chat ──────────── GPT-4o-mini
    │   (conversation)          │                        │
    │                           ├── Reply text           │
    │                           ├── Profile extraction   │
    │                           └── Emergency detection  │
    │
    ├── Pathway Page ──────── POST /pathway ──────────── GPT-4o-mini
    │   (care plan)             │                        (JSON mode)
    │                           └── 4-stage plan
    │
    ├── Autopilot Page ────── Adapter endpoints ──────── No LLM needed
    │   (execution)             │
    │                           ├── AIC adapter ──── Eldercare GeoJSON
    │                           ├── Nursing adapter ── CHAS GeoJSON
    │                           ├── Medication adapter ── HSA CSV + openFDA
    │                           ├── ICCP adapter ──── Telegram (coordinator)
    │                           └── Telegram alert ── Telegram (caregiver)
    │
    ├── Care Brief Page ──── POST /care-brief/generate
    │   (handover)              └── Reads all in-memory logs
    │
    └── Audio Guide ────────── POST /voice/speak
        (voice layer)           ├── GPT-4o-mini (script)
                                └── ElevenLabs (audio)
```

### Key Design Principle: LLM for Understanding, Rules for Action

The LLM (GPT-4o-mini) is used for exactly 4 things:
1. **Conversational replies** — understanding what the user said
2. **Profile extraction** — pulling structured fields from conversation
3. **Pathway generation** — creating a personalised care plan
4. **Voice script generation** — making the Audio Guide sound human

Everything else is **rule-based and deterministic**:
- Emergency detection: keyword matching
- Adapter selection: keyword → adapter mapping
- Service recommendations: distance + keyword scoring over real datasets
- Medication risk classification: age + symptom + drug classification rules
- Guardian safety checks: regex + keyword rules
- Care brief generation: aggregation of in-memory logs

This means: the LLM can go down and the autopilot still works. The adapters still find nearby clinics. The guardian still catches NRIC numbers. Only the chat and pathway pages need the LLM.

---

## 4. The Five Adapters (How Each Works)

### 4.1 AIC Eldercare Services Adapter

**Data source:** `EldercareServices.geojson` — 140 Senior Activity Centres from data.gov.sg

**Algorithm:**
1. Parse HTML table inside each GeoJSON feature to extract NAME, ADDRESS, POSTAL_CODE, coordinates
2. Classify care need into keywords (e.g. "fell" → `["senior activity centre", "SAC", "befriending"]`)
3. For each service: score = keyword_matches × 10 + bonus_for_senior_keyword × 3
4. If user location provided: distance_score = max(0, 30 - distance_km × 3)
5. Total score = match_score + distance_score
6. Sort descending, return top N

**No LLM involved.** Pure data + math.

### 4.2 HomeNursing.sg Provider Adapter

**Data source:** `CHASClinics.geojson` — CHAS clinics from data.gov.sg

**Algorithm:** Same as AIC, but:
- Extracts HCI_NAME, HCI_TEL, POSTAL_CD, STREET_NAME, BUILDING_NAME, CLINIC_PROGRAMME_CODE
- Scores bonus for CDMP (Chronic Disease Management) and ISP (Integrated Screening) programmes
- Generates **simulated availability slots** (seeded by clinic name for consistency)
- Returns slots with type: Home Visit / Clinic Visit / Teleconsult

### 4.3 Medication Review Adapter

**Data sources:** 
- `ListingofRegisteredTherapeuticProducts.csv` — HSA registered drugs
- openFDA drug label API

**Algorithm:**
1. Extract medication names from text using a 28-word common medications list
2. For each medication: search HSA CSV by product_name AND active_ingredients
3. For each medication: query openFDA → `openfda.generic_name` → `openfda.brand_name` → fallback
4. Extract warnings, precautions, adverse reactions (truncated to 300 chars)
5. Risk classification:
   - Age ≥ 65 → flag
   - Dizziness/fall keywords → medium risk
   - Chest pain/seizure keywords → high risk
   - Prescription Only classification → pharmacist review flag
   - openFDA warnings found → pharmacist review flag
6. Format as Telegram HTML message → send to pharmacy group with inline buttons

**Safety:** Always appends 3 disclaimers. Never prescribes or diagnoses.

### 4.4 ICCP Coordinator Adapter

**Channel:** Telegram group (ICCP bot)

**Algorithm:**
1. Assemble case packet from care profile (name, age, issue, risk level)
2. Format as HTML Telegram message with inline buttons: Accept Case / Request More Info / Escalate
3. Send to coordinator group
4. Webhook handles button taps and free-text replies
5. All interactions logged to `iccp_log` for care brief

### 4.5 Caregiver Telegram Alert

**Channel:** Telegram DM (CareBridge bot)

**Algorithm:**
1. Build emergency message from care profile
2. Send to caregiver's chat_id with inline buttons: I'm going now / Call ambulance / Ask neighbor / Escalate
3. Free-text replies → GPT-4o-mini classification → structured response (intent, status, ETA, extra request, urgency)
4. All interactions logged to `telegram_log` for care brief

---

## 5. Guardian — Responsible AI Layer

A lightweight rule-based safety filter applied to every LLM response.

### 5.1 PDPA Redaction
- Regex catches Singapore NRIC (S/T/F/G/M + 7 digits + letter), phone numbers (8-digit starting with 6/8/9), emails
- Replaces with masked versions: `S1234567A` → `S****A`

### 5.2 No-Medical-Advice Classifier
- Scans for patterns: "take X mg", "prescribe", "diagnose", "stop taking", "increase dosage"
- Appends disclaimer if triggered

### 5.3 Human Gate
- Detects risky actions: submit, book, apply, send referral, call ambulance, handover
- Autopilot panels with risky actions show "Approval Required" overlay
- Nothing irreversible runs without user clicking "Approve"

### 5.4 Traceability
- Every panel header shows data sources (e.g. "HSA CSV · openFDA API")
- Care brief shows audit trail of all actions taken

---

## 6. Audio Guide — Voice Layer

### How It Works
1. User clicks "Audio Guide" in header → `guide_started` event fires
2. Backend receives event + context → GPT-4o-mini generates a warm spoken script (2-3 sentences max)
3. Script → ElevenLabs API → MP3 audio bytes returned
4. Frontend plays audio, shows "Speaking..." status

### Voice Events (11 total)
| Event | When | What It Says |
|-------|------|-------------|
| `guide_started` | Guide enabled | "Welcome, I'll talk you through each step" |
| `tutorial_overview` | Tutorial page | Explains the full CareKaki journey |
| `profile_updated` | Chat extracts profile field | "Got it, I've noted that" |
| `care_plan_created` | Pathway loads | Summarises the care plan casually |
| `care_plan_edit_requested` | User edits plan | "Got it, updating the plan" |
| `care_plan_edit_done` | Edit completes | "Done, plan refreshed" |
| `autopilot_explanation` | Autopilot loads | Explains planned actions before approval |
| `autopilot_approved` | User approves | "Okay, working on it" |
| `care_brief_ready` | Care brief loads | Calm handover summary |
| `voice_input_*` | User speaks on any page | Contextual voice reply |

### Anti-Collision System
- New `speak()` cancels any currently playing audio
- 500ms debounce prevents rapid-fire from React re-renders
- AbortController cancels in-flight fetches
- Mic auto-mutes while AI is speaking
- Route changes stop all audio

---

## 7. Emergency Detection + Dynamic Autopilot

### Emergency Detection (No LLM)
- 30 emergency keywords: "fall", "fell", "collapsed", "chest pain", "seizure", "not breathing", etc.
- Checked on every chat message — instant, no API call
- If triggered: stores adapters in sessionStorage → redirects to /autopilot

### Adapter Selection (No LLM)
- 6 rule sets map keywords to adapters:
  - Fall/collapse → ICCP, AIC, Telegram
  - Medication/dizziness → Medication, Telegram
  - Chest pain/stroke → ICCP, Telegram
  - Nursing/wound/rehab → Nursing, ICCP
  - Grant/subsidy → AIC only
  - Lonely/isolated → AIC, Nursing

### Layout Auto-Adjustment
- Autopilot renders only the relevant panels
- Fewer panels = wider panels (CSS flex-1)
- Different users see different autopilot layouts

---

## 8. The Four Demo Users

| User | Scenario | What It Showcases |
|------|----------|-------------------|
| **Mdm Tan** (78, Ang Mo Kio) | Fall + coordinator escalation | AIC eldercare search, ICCP handover, Telegram caregiver alert, map with AMK services |
| **Mr Lim** (72, Toa Payoh) | Loneliness after fall | AIC + nursing + ICCP, different location = different service results |
| **Mrs Wong** (caregiver, Jurong) | Post-surgery nursing | Home nursing booking with availability slots, AIC support, ICCP coordination |
| **Uncle Raj** (85, Yishun) | Full emergency — all systems | ALL 5 adapters activate, medication review (warfarin + heart failure), maximum panel count |

Each user has: pre-filled care profile, chat history, location (different part of Singapore), pre-set adapters, and consent data.

---

## 9. Data Flow: End to End

```
1. User logs in as Mdm Tan
2. SessionStorage loads: profile, location (AMK), adapters [iccp, aic, telegram], chat history
3. Chat page shows pre-filled conversation
4. User sends message → POST /chat
   → GPT-4o-mini replies
   → Profile extraction runs (JSON mode)
   → Emergency detection checks keywords
   → Guardian scrubs response (PDPA, medical advice)
   → Returns: reply + profileUpdate + emergency flag + guardian flags
5. User clicks "View care plan" → /pathway
   → POST /pathway with profile
   → GPT-4o-mini generates 4-stage plan (JSON mode)
   → Cached in sessionStorage (no re-call on revisit)
6. User can edit plan via side chat
   → POST /pathway/edit-items with items + feedback
   → GPT-4o-mini regenerates items
7. User clicks "Launch Autopilot" → /autopilot
   → AgentWorkspace reads autopilotAdapters from sessionStorage
   → Only relevant panels render
   → Each panel auto-triggers its adapter endpoint
   → Maps show real Singapore locations from GeoJSON
   → Telegram sends real messages to real bots
8. User approves → panels go live
9. User clicks "Care Brief" → /handover
   → POST /care-brief/generate
   → Backend reads telegram_log, iccp_log, medication_log
   → Returns: actions_taken, next_steps, important_notes
   → Rendered as a formal care handover document
```

---

## 10. What's Real vs What's Simulated

| Component | Real | Simulated |
|-----------|------|-----------|
| Chat conversation | Real LLM (GPT-4o-mini) | — |
| Profile extraction | Real LLM (JSON mode) | — |
| Care plan generation | Real LLM (JSON mode) | — |
| Eldercare service data | Real (data.gov.sg GeoJSON) | — |
| CHAS clinic data | Real (data.gov.sg GeoJSON) | — |
| HSA drug data | Real (data.gov.sg CSV) | — |
| openFDA drug labels | Real (FDA API) | — |
| Telegram messaging | Real (live bots, real messages) | — |
| Map/geolocation | Real (OpenStreetMap tiles, real coordinates) | User location is hardcoded per demo user |
| Voice output | Real (ElevenLabs) | — |
| Speech-to-text | Real (browser Web Speech API) | — |
| Nursing availability slots | — | Simulated (seeded random, consistent per clinic) |
| Singpass/MyInfo | — | UI mockup only |
| ICCP coordinator | — | Telegram group acting as coordinator queue |
| Pharmacy desk | — | Same Telegram group acting as pharmacy |

---

## 11. Key Design Decisions

**"LLM for understanding, rules for action"** — The LLM never makes care decisions. It understands language and generates plans. All actual actions (recommending services, flagging medications, sending alerts) use deterministic rules over real data.

**"In-memory is a feature, not a bug"** — For a demo, clean state on restart means every demo run is identical. No stale data, no "let me clear the database" between judges.

**"One monolith, modular code"** — `main.py` is one file, but each adapter is a separate module in `services/`. Splitting into microservices is a deployment decision we can make later without changing any logic.

**"Guardian is rules, not another LLM"** — A second LLM call on every response would be slow and expensive. Regex catches NRIC patterns, keyword lists catch medical advice. In production, this becomes an LLM classifier — but the rule-based version covers the demo cases.

**"Audio Guide narrates, never decides"** — The voice layer reads from the same data the visual UI shows. It never makes independent decisions or calls adapters directly.

---

## 12. Production Roadmap (What Changes)

| Hackathon | Production |
|-----------|-----------|
| In-memory Python dicts | Supabase (Postgres) tables |
| 4 hardcoded demo users | Supabase Auth + app profiles |
| Hardcoded locations | Browser geolocation API + OneMap geocoding |
| Keyword emergency detection | LLM classifier with confidence scores |
| Keyword adapter selection | LLM tool-use (function calling) |
| Simulated nursing slots | Real HomeNursing.sg API (when available) |
| Telegram as WhatsApp proxy | WhatsApp Business API |
| Regex guardian | LLM safety classifier + PDPA-compliant logging |
| Consent UI mockup | Real Singpass/MyInfo integration |
| Single monolith | Containerized microservices on k8s |
| npm run dev | Docker Compose → Cloud Run / EKS |
