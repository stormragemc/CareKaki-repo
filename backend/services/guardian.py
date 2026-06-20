"""Guardian — CareKaki's cross-cutting Responsible-AI layer.

A real, separately-callable safety service (user-flows.md §8, UC-8 / UC-10). It is
deliberately rule-based and deterministic so it can be demoed live in Q&A: the same
input always yields the same decision, and "no medical advice" is enforced in code,
not in a prompt.

Two principles:
  1. No medical advice — clinical questions are intercepted, never answered, and the
     caller is routed to a human (the coordinator path).
  2. PDPA scrub — PII (NRIC/FIN, phone, email) is detected and tokenised before any
     logging or downstream use; raw identifiers never leave the boundary.

`guardian_check(text)` returns a stable verdict the API exposes at POST /guardian/check.
"""

import re
from typing import Literal, TypedDict

Decision = Literal["allow", "block"]
Category = Literal["none", "medical_advice", "pii"]


class GuardianVerdict(TypedDict):
    decision: Decision
    category: Category
    reason: str
    matched: list[str]
    redacted: str


# ── PII detectors (Singapore-specific) ───────────────────────────────────────
# NRIC / FIN: prefix S/T/F/G/M + 7 digits + checksum letter.
_NRIC_RE = re.compile(r"\b[STFGM]\d{7}[A-Z]\b", re.IGNORECASE)
# SG mobile/landline: 8 digits starting 6/8/9, optional +65 country code.
_PHONE_RE = re.compile(r"(?<![\d.])(?:\+?65[\s-]?)?[689]\d{3}[\s-]?\d{4}(?![\d.])")
_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")

_PII_PATTERNS: list[tuple[str, re.Pattern[str], str]] = [
    ("NRIC/FIN", _NRIC_RE, "[NRIC]"),
    ("email", _EMAIL_RE, "[EMAIL]"),
    ("phone", _PHONE_RE, "[PHONE]"),
]

# ── Medical-advice detectors ─────────────────────────────────────────────────
# Dosage instructions, e.g. "take 2 tablets", "500 mg twice daily".
_DOSAGE_RE = re.compile(
    r"\b\d+\s?(?:mg|mcg|ml|g|iu|units?|tablets?|pills?|capsules?|doses?|puffs?|drops?)\b",
    re.IGNORECASE,
)
# Imperatives / questions that seek a clinical decision about medication or treatment.
_MED_ADVICE_RE = re.compile(
    r"\b(?:"
    r"prescrib\w*|diagnos\w*|overdose|"
    r"(?:increase|decrease|adjust|change|switch|stop|start|skip|double|halve)\s+"
    r"(?:the\s+|her\s+|his\s+|their\s+|my\s+)?(?:dose|dosage|medication|meds|tablets?|pills?|insulin)|"
    r"(?:should|can|do)\s+(?:i|we|she|he|they)\s+(?:take|give|stop|change|increase|decrease|adjust)|"
    r"is\s+it\s+safe\s+to\s+take|"
    r"what\s+(?:dose|dosage|medication|medicine)|"
    r"how\s+(?:much|many)\s+\w+\s+should"
    r")\b",
    re.IGNORECASE,
)

_ROUTE_TO_HUMAN = (
    "CareKaki does not give medical advice. This looks like a clinical question — "
    "I've flagged it for a human care coordinator who can help (one click away)."
)


def _scan_pii(text: str) -> tuple[list[str], str]:
    """Return (matched PII types, redacted text)."""
    matched: list[str] = []
    redacted = text
    for label, pattern, token in _PII_PATTERNS:
        if pattern.search(redacted):
            matched.append(label)
            redacted = pattern.sub(token, redacted)
    return matched, redacted


def guardian_check(text: str) -> GuardianVerdict:
    """Classify a message and decide whether CareKaki may act on it as-is.

    PII is checked first (it must be tokenised regardless of intent); then the
    no-medical-advice rule. An empty/clean message is allowed unchanged.
    """
    text = (text or "").strip()

    pii_matched, redacted = _scan_pii(text)
    if pii_matched:
        joined = ", ".join(pii_matched)
        return GuardianVerdict(
            decision="block",
            category="pii",
            reason=(
                f"Personal data detected ({joined}). Guardian tokenised it before "
                f"logging — raw identifiers never leave the regional boundary."
            ),
            matched=pii_matched,
            redacted=redacted,
        )

    med_hits = _MED_ADVICE_RE.findall(text) or _DOSAGE_RE.findall(text)
    if med_hits:
        return GuardianVerdict(
            decision="block",
            category="medical_advice",
            reason=_ROUTE_TO_HUMAN,
            matched=[m if isinstance(m, str) else " ".join(m) for m in med_hits],
            redacted=redacted,
        )

    return GuardianVerdict(
        decision="allow",
        category="none",
        reason="No medical advice or personal data detected.",
        matched=[],
        redacted=redacted,
    )
