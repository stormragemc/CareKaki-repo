# Q&A prep — live demos + answers

Ammo for the ~10-minute Q&A. Each item is something we can **run live** or answer
honestly to show an architectural claim is real, not a slide.

Base URL: `http://localhost:8000` (local `uvicorn` or `docker compose up`).

---

## 🔴 Guardian — Responsible AI is code, not a prompt

`guardian` is a **real, separately callable** safety layer (`backend/services/guardian.py`),
not a system prompt. It's deterministic (regex + keyword rules), so it behaves identically
every time. It also **wraps the live `/chat` path** — every OpenAI reply passes through
`guardian_check` before it reaches the user (PII redacted, medical disclaimer appended).

- **Endpoint:** `POST /guardian/check` → JSON verdict
- **Request:** `{ "text": "...", "adapter_name": "...", "data_sources": ["..."] }`
- **Verdict fields:** `safe_text`, `original_redacted`, `medical_disclaimer`,
  `requires_confirmation`, `risky_actions`, `traceability`, `flags`, `flag_count`, `passed`
- **Four principles, all rule-based:**
  1. **PDPA redaction** — NRIC/FIN → `S****A`, phone → `9123****`, email → `****@****`.
  2. **No medical advice** — dosage/prescription/diagnosis/cessation language flagged; disclaimer forced.
  3. **Human gate** — risky actions (`submit`, `book`, `apply`, `escalate`, `handover`, …) set `requires_confirmation`.
  4. **Traceability** — every pass stamped with `adapter` + `data_sources` + timestamp.

### Example 1 — medical-advice intercept

```bash
curl -s -X POST http://localhost:8000/guardian/check \
  -H 'Content-Type: application/json' \
  -d '{"text": "Stop taking your warfarin and increase the dose of aspirin"}'
```

Returns (`passed: false`, disclaimer forced):

```json
{
  "safe_text": "Stop taking your warfarin and increase the dose of aspirin",
  "original_redacted": false,
  "medical_disclaimer": "Note: CareKaki does not provide medical advice. Please consult a healthcare professional for clinical guidance.",
  "flags": [
    "Medical safety: Medication cessation advice detected",
    "Medical safety: Dosage change advice detected"
  ],
  "flag_count": 2,
  "passed": false
}
```

### Example 2 — PDPA redaction + human gate

```bash
curl -s -X POST http://localhost:8000/guardian/check \
  -H 'Content-Type: application/json' \
  -d '{"text": "Patient NRIC S1234567A, call 91234567 to book the appointment"}'
```

Returns (NRIC + phone masked, booking gated):

```json
{
  "safe_text": "Patient NRIC S****A, call 9123**** to book the appointment",
  "original_redacted": true,
  "requires_confirmation": true,
  "risky_actions": ["book"],
  "flags": [
    "PDPA: 1 NRIC number(s) redacted",
    "PDPA: 1 phone number(s) redacted",
    "Human gate: action requires approval (book)"
  ],
  "flag_count": 3,
  "passed": false
}
```

### Contrast — a normal care request passes clean

```bash
curl -s -X POST http://localhost:8000/guardian/check \
  -H 'Content-Type: application/json' \
  -d '{"text": "My mum had a fall and lives alone, can you help arrange care?"}'
# → { ..., "flags": [], "flag_count": 0, "passed": true }
```

**Soundbite:** *"Guardian wraps every adapter and the chat itself. I can call it right now —
it redacts an NRIC, forces a disclaimer on medical advice, and gates a booking behind human
approval. The guarantee is in code, not in a prompt."*

---

## 🔴 AIC Eldercare Adapter — real data, real map

```bash
curl -s -X POST http://localhost:8000/integrations/aic/recommend \
  -H 'Content-Type: application/json' \
  -d '{"care_need": "Granny fell off the stairs", "latitude": 1.3521, "longitude": 103.8198, "limit": 3}'
```

Returns real Senior Activity Centres from data.gov.sg GeoJSON, scored by keyword relevance +
haversine distance. The autopilot renders these on a Leaflet/OpenStreetMap map with numbered
markers, fullscreen mode, and a Google Maps-style bottom sheet on marker click.

**Soundbite:** *"That's real government data — 140 eldercare centres from data.gov.sg, scored
by distance from the patient's location. Not a mock."*

---

## 🔴 Medication Review — HSA + openFDA

```bash
curl -s -X POST http://localhost:8000/integrations/medication-review/request \
  -H 'Content-Type: application/json' \
  -d '{"senior_name":"Mdm Tan","age":78,"medications":["amlodipine","metformin"],"symptom":"dizziness","context":"fell earlier today"}'
```

Returns: HSA-registered products matching each drug, openFDA warnings/precautions, risk
classification (medium — dizziness + age 78), and a formatted Telegram message sent to the
pharmacy desk group.

**Soundbite:** *"That's the real HSA drug registry — every registered therapeutic product in
Singapore — enriched with the US FDA's public drug labels. The risk classification is
rule-based: age, symptoms, and forensic classification. No LLM guessing."*

---

## 🔴 Nursing Provider Adapter — real clinics

```bash
curl -s -X POST http://localhost:8000/integrations/nursing/recommend \
  -H 'Content-Type: application/json' \
  -d '{"care_need": "Post-surgery wound care", "latitude": 1.348, "longitude": 103.73, "limit": 3}'
```

Returns real CHAS clinics from data.gov.sg, with phone numbers, programme codes
(CDMP/CHAS/ISP), and simulated availability slots.

---

## 🔴 Audio Guide — ElevenLabs voice

If Audio Guide is enabled, any page navigation triggers a voice event. Show:

1. Click "Audio Guide" button → hear the welcome greeting
2. Navigate to the pathway → hear a casual care plan summary
3. Navigate to autopilot → hear the pre-approval explanation
4. Click mic on the chat page → speak → it sends as a message → LLM responds

**Soundbite:** *"That's ElevenLabs generating a natural voice from a script written by
GPT-4o-mini. The mic uses browser Speech Recognition. The voice never makes decisions —
it narrates what CareKaki is doing."*

---

## 🔴 Emergency Detection — no LLM needed

Type "my grandmother collapsed and is not breathing" in the chat. The system:
1. Detects emergency keywords instantly (no API call)
2. Selects adapters: ICCP + Telegram (critical emergency)
3. Redirects to autopilot immediately (skips pathway)
4. Only relevant panels render

**Soundbite:** *"Emergency detection is 30 keywords checked in JavaScript. No LLM latency.
The adapter selection is rule-based too — different situations activate different services."*

---

## 🔴 Dynamic Autopilot — different users, different panels

Sign in as Mdm Tan → 3 panels (ICCP, AIC, Telegram).
Sign in as Uncle Raj → 5 panels (all adapters).
Sign in as Mrs Wong → 3 panels (Nursing, AIC, ICCP).

**Soundbite:** *"The autopilot isn't one-size-fits-all. The system decides which services
are relevant based on the situation. Fewer panels = wider panels. The layout auto-adjusts."*

---

## 🔴 Care Brief — live data, not a template

Navigate to the Care Brief after running the autopilot. The brief shows:
- "Caregiver alerted via Telegram" — because it actually sent a Telegram message
- "ICCP case packet assembled" — because the coordinator group actually received it
- "Medication review sent to Pharmacy Desk" — because it actually routed there

```bash
curl -s -X POST http://localhost:8000/care-brief/generate \
  -H 'Content-Type: application/json' \
  -d '{"senior_name":"Mdm Tan","age":78,"situation":"Fell at home","caregiver":"Daughter"}'
```

**Soundbite:** *"The care brief isn't a template. It reads from the actual session logs.
If the coordinator accepted the case on Telegram, that shows up. If they didn't, it doesn't."*

---

## Common Q&A answers

### "Is this WhatsApp or Telegram?"
The prototype uses Telegram — instant bot creation, no Meta business verification needed. The
adapter interface is identical: message + buttons + webhook. When WhatsApp Business API access
is approved, the same flow plugs in. We chose demo reliability over brand fidelity.

### "Is Kubernetes running?"
The slides show our target architecture. For the MVP, we validated core flows in Docker Compose
with a modular monolith. Each adapter is a separate Python module — splitting into K8s
deployments is a deployment decision, not a code rewrite.

### "Show me the MyInfo call."
The consent screen and data flow are built as if MyInfo exists. We couldn't get sandbox access
in hackathon time, but the profile fields map 1:1 to MyInfo's schema. In production, that
screen becomes real with one API integration.

### "What LLM are you using?"
OpenAI GPT-4o-mini. We started on Gemini, hit the free-tier rate limit (5 req/min), and
migrated. The architecture is model-agnostic — same prompts, same JSON-mode extraction,
different SDK. Swapping is a config change.

### "What about non-English speakers?"
The LLM already handles Mandarin, Malay, Tamil, Singlish. The profile is structured data
(language-independent). ElevenLabs uses the multilingual v2 model. Honest caveat: we haven't
tested extraction quality across all languages. The claim is "the architecture supports it."

### "How does the Audio Guide work?"
GPT-4o-mini generates a short spoken script (2-3 sentences, warm caregiver tone). ElevenLabs
converts it to MP3. The frontend plays it. On the chat page, the mic lets you speak instead
of type via browser Speech Recognition. The voice never makes decisions — it narrates.
Anti-collision: new speech cancels any current playback, mic mutes while AI speaks.

### "What's the difference between your adapters and a simple API call?"
Each adapter has its own data source, scoring algorithm, and output format. AIC parses HTML
inside GeoJSON and scores by keyword + haversine distance. Medication searches HSA by both
product name and active ingredients, enriches with openFDA, and applies rule-based risk
classification. None use an LLM. They're pure data + rules + real datasets.

### "Did the family authorise CareKaki to act?"
Yes — Autopilot drafts every action and the user approves. Three panels require explicit
approval (ICCP, Nursing, Medication). Two auto-run because they're read-only (AIC search,
Telegram alert). Only human-escalation bypasses confirmation.

### "What happens to NRIC data?"
Guardian redacts it before it reaches any log or external service. `S1234567A` → `S****A`.
Rule-based regex — deterministic, not probabilistic. Demonstrable live via `/guardian/check`.
