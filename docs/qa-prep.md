# Q&A prep — live demos

Ammo for the ~10-minute Q&A (`user-flows.md` §8). Each item is something we can run
*live* to show an architectural claim is real, not a slide.

---

## Guardian — "no medical advice" is architectural, not a prompt (UC-8 / UC-10)

`guardian` is a **real, separately-callable** Responsible-AI service, not a system
prompt. It's deterministic, so it behaves identically every time we run it on stage.

- **Endpoint:** `POST /guardian/check` → `{ decision, category, reason, matched, redacted }`
- **`decision`:** `allow` | `block`
- **`category`:** `none` | `medical_advice` | `pii`
- **Rules:**
  1. **No medical advice (UC-8)** — clinical questions (dosage, "should I change her
     medication", diagnosis, prescribing) are **intercepted, never answered**, and the
     caller is routed to a human coordinator.
  2. **PDPA scrub (UC-10)** — PII (NRIC/FIN, phone, email) is detected and **tokenised**
     (`S1234567A` → `[NRIC]`) before anything is logged; raw identifiers never leave the
     boundary.

Base URL is `http://localhost:8000` (local `uvicorn`) or `http://localhost:8000` via
`docker compose up`.

### Example 1 — reject a medical question (the UC-8 headline)

```bash
curl -s -X POST http://localhost:8000/guardian/check \
  -H 'Content-Type: application/json' \
  -d '{"text": "Is this dangerous? Should I change her medication?"}'
```

Expected:

```json
{
  "decision": "block",
  "category": "medical_advice",
  "reason": "CareKaki does not give medical advice. This looks like a clinical question — I've flagged it for a human care coordinator who can help (one click away).",
  "matched": ["Should I change"],
  "redacted": "Is this dangerous? Should I change her medication?"
}
```

### Example 2 — tokenise PII before logging (UC-10)

```bash
curl -s -X POST http://localhost:8000/guardian/check \
  -H 'Content-Type: application/json' \
  -d '{"text": "Here is her NRIC S1234567A, call me on 91234567"}'
```

Expected:

```json
{
  "decision": "block",
  "category": "pii",
  "reason": "Personal data detected (NRIC/FIN, phone). Guardian tokenised it before logging — raw identifiers never leave the regional boundary.",
  "matched": ["NRIC/FIN", "phone"],
  "redacted": "Here is her NRIC [NRIC], call me on [PHONE]"
}
```

### Contrast — a normal care request is allowed

```bash
curl -s -X POST http://localhost:8000/guardian/check \
  -H 'Content-Type: application/json' \
  -d '{"text": "My mum had a fall and lives alone, can you help arrange care?"}'
# → { "decision": "allow", "category": "none", ... }
```

**Soundbite:** *"Guardian wraps all five services. It's a service we can call right now —
it rejects a medical question and tokenises an NRIC before it's ever logged. The
guarantee is in code, not in a prompt."*
