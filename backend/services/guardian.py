"""
CareKaki Guardian — Responsible AI Layer

Lightweight rule-based safety filter applied to all agent outputs.
In production this would be a dedicated LLM classifier; the rule-based
version covers the core cases for the hackathon demo.
"""

import re
from datetime import datetime

# ── 1. PDPA Redaction ────────────────────────────────────────────────────────
# Singapore NRIC: S/T/F/G/M + 7 digits + letter
NRIC_PATTERN = re.compile(r"\b[STFGM]\d{7}[A-Z]\b", re.IGNORECASE)
# Singapore phone: 8 digits starting with 6/8/9, optional +65 prefix
PHONE_PATTERN = re.compile(r"(?:\+65[\s-]?)?\b[689]\d{7}\b")
# Email
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")

def redact_pdpa(text: str) -> dict:
    flags = []
    redacted = text

    nric_matches = NRIC_PATTERN.findall(text)
    if nric_matches:
        for m in nric_matches:
            redacted = redacted.replace(m, m[0] + "****" + m[-1])
        flags.append(f"PDPA: {len(nric_matches)} NRIC number(s) redacted")

    phone_matches = PHONE_PATTERN.findall(text)
    if phone_matches:
        for m in phone_matches:
            redacted = redacted.replace(m, m[:4] + "****")
        flags.append(f"PDPA: {len(phone_matches)} phone number(s) redacted")

    email_matches = EMAIL_PATTERN.findall(text)
    if email_matches:
        for m in email_matches:
            redacted = redacted.replace(m, "****@****")
        flags.append(f"PDPA: {len(email_matches)} email(s) redacted")

    return {"text": redacted, "flags": flags, "redacted": len(flags) > 0}


# ── 2. No-Medical-Advice Classifier ─────────────────────────────────────────

MEDICAL_ADVICE_PATTERNS = [
    (re.compile(r"\btake\s+\d+\s*mg\b", re.IGNORECASE), "Specific dosage recommendation detected"),
    (re.compile(r"\bprescribe[ds]?\b", re.IGNORECASE), "Prescription language detected"),
    (re.compile(r"\bdiagnos(?:e[ds]?|is)\b", re.IGNORECASE), "Diagnostic language detected"),
    (re.compile(r"\bstop\s+(?:taking|your)\s+\w+", re.IGNORECASE), "Medication cessation advice detected"),
    (re.compile(r"\bincrease\s+(?:the\s+)?dos(?:e|age)\b", re.IGNORECASE), "Dosage change advice detected"),
    (re.compile(r"\breduce\s+(?:the\s+)?dos(?:e|age)\b", re.IGNORECASE), "Dosage change advice detected"),
    (re.compile(r"\byou\s+(?:have|are suffering from)\s+\w+", re.IGNORECASE), "Diagnostic language detected"),
]

MEDICAL_DISCLAIMER = "Note: CareKaki does not provide medical advice. Please consult a healthcare professional for clinical guidance."

def check_medical_advice(text: str) -> dict:
    flags = []
    for pattern, label in MEDICAL_ADVICE_PATTERNS:
        if pattern.search(text):
            flags.append(f"Medical safety: {label}")

    needs_disclaimer = len(flags) > 0
    return {
        "flags": flags,
        "needs_disclaimer": needs_disclaimer,
        "disclaimer": MEDICAL_DISCLAIMER if needs_disclaimer else None,
    }


# ── 3. Human-Gate Flag ──────────────────────────────────────────────────────

RISKY_ACTIONS = [
    "submit", "book", "apply", "send referral", "escalat",
    "call ambulance", "call 995", "notify next-of-kin",
    "handover", "transfer case",
]

def check_human_gate(text: str) -> dict:
    lower = text.lower()
    triggered = [action for action in RISKY_ACTIONS if action in lower]
    return {
        "requires_confirmation": len(triggered) > 0,
        "risky_actions": triggered,
        "gate_message": "This action requires caregiver/supervisor approval before proceeding." if triggered else None,
    }


# ── 4. Traceability ─────────────────────────────────────────────────────────

def add_traceability(adapter_name: str, data_sources: list[str]) -> dict:
    return {
        "adapter": adapter_name,
        "sources": data_sources,
        "timestamp": datetime.now().isoformat(),
        "traceable": True,
    }


# ── 5. Full Guardian Pass ────────────────────────────────────────────────────

def guardian_check(text: str, adapter_name: str = "", data_sources: list[str] | None = None) -> dict:
    pdpa = redact_pdpa(text)
    medical = check_medical_advice(pdpa["text"])
    gate = check_human_gate(pdpa["text"])
    trace = add_traceability(adapter_name, data_sources or [])

    all_flags = pdpa["flags"] + medical["flags"]
    if gate["requires_confirmation"]:
        all_flags.append(f"Human gate: action requires approval ({', '.join(gate['risky_actions'])})")

    return {
        "safe_text": pdpa["text"],
        "original_redacted": pdpa["redacted"],
        "medical_disclaimer": medical["disclaimer"],
        "requires_confirmation": gate["requires_confirmation"],
        "risky_actions": gate["risky_actions"],
        "traceability": trace,
        "flags": all_flags,
        "flag_count": len(all_flags),
        "passed": len(all_flags) == 0,
    }
