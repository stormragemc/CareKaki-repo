"""Risk triage + adapter planning — the deterministic core of the care graph.

These are pure functions (no LLM, no network) so they run identically in offline
mode and are cheap to unit-test. The LangGraph nodes wrap them; the FastAPI layer
imports them so there is a single source of truth for "is this an emergency?" and
"which adapters should fire?".
"""

# ── Emergency + risk signal lexicons ─────────────────────────────────────────

HIGH_RISK_KEYWORDS = [
    "chest pain", "heart attack", "stroke", "seizure", "choking",
    "bleeding", "can't breathe", "cannot breathe", "shortness of breath",
    "not breathing", "unconscious", "unresponsive", "collapsed", "collapse",
    "ambulance", "999", "995", "fainted", "passed out",
]

MEDIUM_RISK_KEYWORDS = [
    "fall", "fell", "hit head", "head injury", "broken", "fracture",
    "not moving", "dizzy", "dizziness", "giddy", "weak", "confused",
    "emergency", "urgent", "help now",
]

# Retained for backwards-compatible emergency detection (any high/medium hit).
EMERGENCY_KEYWORDS = HIGH_RISK_KEYWORDS + MEDIUM_RISK_KEYWORDS


def classify_risk(text: str) -> str:
    """Return an ordinal risk signal: 'high' | 'medium' | 'low'.

    This is the 'early risk signal' surfaced to the caregiver — a lightweight,
    explainable proxy for the fine-tuned safety-escalation classifier that
    replaces it once the Qwen2.5 model is serving.
    """
    lower = text.lower()
    if any(kw in lower for kw in HIGH_RISK_KEYWORDS):
        return "high"
    if any(kw in lower for kw in MEDIUM_RISK_KEYWORDS):
        return "medium"
    return "low"


def detect_emergency(text: str) -> bool:
    return classify_risk(text) in ("high", "medium")


# ── Adapter planning ─────────────────────────────────────────────────────────

ADAPTER_RULES: list[tuple[list[str], list[str]]] = [
    (["fall", "fell", "collapsed", "collapse", "fracture", "broken", "hit head", "head injury",
      "not moving", "fainted", "passed out", "unconscious", "unresponsive"],
     ["iccp", "aic", "telegram"]),
    (["dizzy", "dizziness", "medication", "medicine", "drug", "pill", "tablet",
      "side effect", "nausea", "vomit", "allergic", "reaction"],
     ["medication", "telegram"]),
    (["chest pain", "heart attack", "stroke", "seizure", "choking",
      "bleeding", "can't breathe", "cannot breathe", "shortness of breath",
      "not breathing", "ambulance", "999", "995"],
     ["iccp", "telegram"]),
    (["nursing", "home care", "wound", "dressing", "catheter", "injection",
      "physiotherapy", "rehab", "discharge", "post-surgery"],
     ["nursing", "iccp"]),
    (["grant", "subsidy", "financial", "caregiver grant", "means test",
      "assistance", "support scheme"],
     ["aic"]),
    (["lonely", "alone", "isolated", "social", "depressed", "activity centre",
      "day care", "respite"],
     ["aic", "nursing"]),
]


def plan_adapters(text: str) -> list[str]:
    lower = text.lower()
    active: list[str] = []
    for triggers, adapters in ADAPTER_RULES:
        if any(t in lower for t in triggers):
            active.extend(adapters)
    if not active:
        active = ["iccp", "nursing", "aic", "telegram"]
    return list(dict.fromkeys(active))
