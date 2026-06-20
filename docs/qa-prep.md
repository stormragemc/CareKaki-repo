# Q&A prep — live demos

Ammo for the ~10-minute Q&A (`user-flows.md` §8). Each item is something we can run
*live* to show an architectural claim is real, not a slide.

---

## Guardian — Responsible-AI is architectural, not a prompt (UC-8 / UC-10)

`guardian` is a **real, separately-callable** safety layer (`backend/services/guardian.py`),
not a system prompt. It's deterministic, so it behaves identically every time. It also
**wraps the live `/chat` path** — every OpenAI reply is passed through `guardian_check`
before it reaches the user (PII redacted, medical disclaimer appended).

- **Endpoint:** `POST /guardian/check` → JSON verdict
- **Request:** `{ "text": "...", "adapter_name": "...", "data_sources": ["..."] }` (last two optional)
- **Verdict fields:** `safe_text`, `original_redacted`, `medical_disclaimer`,
  `requires_confirmation`, `risky_actions`, `traceability`, `flags`, `flag_count`, `passed`
- **Four principles, all rule-based:**
  1. **PDPA redaction (UC-10)** — NRIC/FIN → `S****A`, phone → `9123****`, email → `****@****`.
  2. **No medical advice (UC-8)** — dosage/prescription/diagnosis/cessation language is flagged and a disclaimer is forced; CareKaki never answers the clinical question itself.
  3. **Human gate** — risky actions (`submit`, `book`, `apply`, `escalate`, `handover`, …) set `requires_confirmation`.
  4. **Traceability** — every pass is stamped with `adapter` + `data_sources` + timestamp.

Base URL is `http://localhost:8000` (local `uvicorn` or `docker compose up`).

### Example 1 — medical-advice intercept (UC-8 headline)

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
  "requires_confirmation": false,
  "risky_actions": [],
  "flags": [
    "Medical safety: Medication cessation advice detected",
    "Medical safety: Dosage change advice detected"
  ],
  "flag_count": 2,
  "passed": false
}
```

### Example 2 — PDPA redaction + human gate (UC-10)

```bash
curl -s -X POST http://localhost:8000/guardian/check \
  -H 'Content-Type: application/json' \
  -d '{"text": "Patient NRIC S1234567A, call 91234567 to book the appointment"}'
```

Returns (NRIC + phone masked in `safe_text`, booking gated):

```json
{
  "safe_text": "Patient NRIC S****A, call 9123**** to book the appointment",
  "original_redacted": true,
  "medical_disclaimer": null,
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
