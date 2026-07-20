"""Generate the CareKaki domain fine-tuning dataset.

Produces ~4,000 de-identified, chat-formatted examples across three task types
the resume calls out:

  1. tool_selection      — caregiver message → structured adapter plan (JSON)
  2. safety_escalation   — caregiver message → risk level + escalate decision (JSON)
  3. evidence_response   — context + retrieved evidence → grounded, no-medical-advice reply

Ground-truth labels for (1) and (2) are derived from CareKaki's own deterministic
triage policy (backend/agent/triage.py), so the fine-tune *distils the production
policy* into Qwen2.5-1.5B rather than inventing labels. Scenarios are built from
combinatorial templates (no real names / NRICs / phones — PDPA-safe by construction).
An optional --paraphrase pass uses the OpenAI API to add linguistic diversity while
keeping the derived labels fixed.

Usage:
    python generate_dataset.py --n 4000 --out data
    python generate_dataset.py --n 4000 --out data --paraphrase 0.25   # needs OPENAI_API_KEY
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
from pathlib import Path

# Make the backend package importable so labels come from the real triage policy.
_HERE = Path(__file__).resolve().parent
_BACKEND = _HERE.parent / "backend"
sys.path.insert(0, str(_BACKEND))

from agent.triage import classify_risk, plan_adapters  # noqa: E402

SYSTEM_PROMPT = (
    "You are CareKaki, an accessibility-first care-navigation assistant for senior "
    "care in Singapore. You never give medical diagnoses or prescriptions. You route "
    "cases to the right services and escalate risk to humans."
)

ADAPTER_LABELS = {
    "iccp": "ICCP care-coordinator handover",
    "nursing": "home-nursing provider search",
    "aic": "AIC eldercare service recommendation",
    "medication": "medication review (pharmacist desk)",
    "telegram": "caregiver emergency alert",
}

# ── Scenario building blocks (de-identified) ─────────────────────────────────

SUBJECTS = [
    "my mother", "my father", "my elderly aunt", "my grandmother", "my grandfather",
    "the senior I care for", "my mother-in-law", "my neighbour's elderly father",
    "my 82-year-old mum", "my dad who lives alone", "our elderly resident",
]

# Each event maps to the kind of situation; labels are derived, not hardcoded.
HIGH_EVENTS = [
    "is having chest pain and shortness of breath",
    "collapsed and is unresponsive",
    "is bleeding heavily after a fall",
    "had what looks like a stroke — face drooping, can't speak",
    "had a seizure just now",
    "is choking and can't breathe",
    "fainted and passed out on the floor",
]
MEDIUM_EVENTS = [
    "fell in the bathroom and hit her head",
    "has been very dizzy and giddy since this morning",
    "slipped and may have fractured her wrist",
    "seems weak and confused today",
    "fell but says she is okay, just shaken",
    "has a bad headache after a minor fall",
]
MED_EVENTS = [
    "feels nauseous after taking her new blood pressure pill",
    "might be having a side effect from her medication",
    "took her warfarin and now has unusual bruising",
    "is unsure whether she double-dosed her metformin",
    "feels drowsy after a change in her medicine",
]
NURSING_EVENTS = [
    "was discharged after surgery and needs wound dressing at home",
    "needs help with a catheter and post-surgery care",
    "requires physiotherapy and home rehab after a hospital stay",
    "needs regular home nursing for an injection schedule",
]
AIC_EVENTS = [
    "is very lonely and isolated at home all day",
    "needs a senior activity centre nearby for companionship",
    "may qualify for a caregiver grant or subsidy",
    "would benefit from a day-care or befriending programme",
]
CALM_EVENTS = [
    "is generally doing okay but I want to plan ahead for her care",
    "is managing well and I'd like to understand available services",
    "just needs some general advice on ageing-in-place support",
]

CONTEXTS = [
    "", " She lives alone.", " We stay in a rental flat in the west.",
    " I am her only caregiver and I work full time.", " She is on several medications.",
    " We don't have much family support nearby.", " Money is tight for us.",
]

ALL_EVENT_GROUPS = [
    HIGH_EVENTS, MEDIUM_EVENTS, MED_EVENTS, NURSING_EVENTS, AIC_EVENTS, CALM_EVENTS,
]

# ── Evidence-grounded response building blocks ───────────────────────────────

EVIDENCE_SNIPPETS = [
    {"source": "AIC Eldercare [E1]",
     "text": "Senior Activity Centres (SACs) offer drop-in social activities, "
             "befriending and basic wellness checks for seniors living nearby."},
    {"source": "AIC Eldercare [E2]",
     "text": "The Home Caregiving Grant provides monthly support to caregivers of "
             "seniors with permanent moderate disability, subject to means-testing."},
    {"source": "CHAS Clinics [E3]",
     "text": "CHAS clinics provide subsidised outpatient care; the nearest participating "
             "GP can advise on chronic-condition follow-up."},
    {"source": "Home Nursing [E4]",
     "text": "Home nursing providers offer wound care, catheter management and "
             "post-discharge rehabilitation delivered at the senior's home."},
    {"source": "HSA Product Register [E5]",
     "text": "Medication concerns should be reviewed by a licensed pharmacist; HSA "
             "registration data confirms a product's classification and active ingredients."},
]

# Combinatorial question templates: (template with {subj}, evidence ids to cite).
EVIDENCE_TEMPLATES = [
    ("What support is there for {subj} who is lonely and stays home all day?", ["E1", "E2"]),
    ("Is there financial help for me while I care for {subj}?", ["E2"]),
    ("{subj_cap} was discharged after surgery and needs wound care — what are the options?", ["E4"]),
    ("I'm worried about a possible side effect from {subj}'s new pill — what should I do?", ["E5"]),
    ("Where can {subj} get subsidised check-ups nearby?", ["E3"]),
    ("How do I find social activities for {subj} near our flat?", ["E1"]),
    ("{subj_cap} needs regular nursing at home after a hospital stay — how does that work?", ["E4"]),
    ("Are there any grants I can apply for as {subj}'s caregiver?", ["E2"]),
    ("Who should review {subj}'s medications if I have concerns?", ["E5"]),
    ("Can {subj} see a doctor at a lower cost somewhere close by?", ["E3"]),
    ("{subj_cap} seems isolated — what community programmes exist?", ["E1", "E3"]),
    ("What's available if {subj} needs both companionship and health checks?", ["E1", "E4"]),
]

EVIDENCE_OPENERS = [
    "", "Sorry to bother you, but ", "Quick question — ", "Hi CareKaki, ",
    "I'm not sure where to start. ", "Please help: ",
]


def _evidence_block(cite_ids: list[str]) -> tuple[str, list[dict]]:
    chosen = [e for e in EVIDENCE_SNIPPETS if any(c in e["source"] for c in cite_ids)]
    block = "\n".join(f"- {e['source']}: {e['text']}" for e in chosen)
    return block, chosen


def _grounded_answer(question: str, chosen: list[dict]) -> str:
    tags = " ".join(f"[{c['source'].split('[')[-1].rstrip(']')}]"
                    if "[" not in c["source"].split()[-1] else ""
                    for c in chosen)
    cite_tags = " ".join(
        "[" + e["source"].split("[")[1] for e in chosen if "[" in e["source"]
    )
    lines = []
    for e in chosen:
        tag = "[" + e["source"].split("[")[1] if "[" in e["source"] else ""
        # First clause of the snippet, framed as a suggestion, with its citation.
        summary = e["text"].split(";")[0].split(".")[0].strip()
        lines.append(f"{summary} {tag}.")
    body = " ".join(lines)
    return (
        f"Here's what may help: {body} "
        "I can't give medical advice — for anything clinical, please check with a "
        "doctor or pharmacist. Would you like me to arrange any of these for you?"
    )


# ── Example constructors ─────────────────────────────────────────────────────

def make_tool_selection_example(rng: random.Random) -> dict:
    subj = rng.choice(SUBJECTS)
    event = rng.choice(rng.choice(ALL_EVENT_GROUPS))
    ctx = rng.choice(CONTEXTS)
    message = f"{subj.capitalize()} {event}.{ctx}".strip()

    risk = classify_risk(message)
    adapters = plan_adapters(message) if risk in ("high", "medium") else []
    label = {"risk_level": risk, "adapters": adapters}

    user = (
        "Decide how CareKaki should route this caregiver message. Return ONLY JSON: "
        '{"risk_level": "high|medium|low", "adapters": [ ... ]}. '
        "Valid adapters: iccp, nursing, aic, medication, telegram.\n\n"
        f"Message: {message}"
    )
    return _chat(user, json.dumps(label), task="tool_selection")


def make_safety_example(rng: random.Random) -> dict:
    subj = rng.choice(SUBJECTS)
    event = rng.choice(rng.choice(ALL_EVENT_GROUPS))
    ctx = rng.choice(CONTEXTS)
    message = f"{subj.capitalize()} {event}.{ctx}".strip()

    risk = classify_risk(message)
    escalate = risk in ("high", "medium")
    label = {"risk_level": risk, "escalate_to_human": escalate,
             "reason": f"classified {risk} risk from reported symptoms"}
    user = (
        "Classify the safety risk of this message and decide whether to escalate to a "
        'human coordinator. Return ONLY JSON: {"risk_level": "high|medium|low", '
        '"escalate_to_human": true|false, "reason": "..."}.\n\n'
        f"Message: {message}"
    )
    return _chat(user, json.dumps(label), task="safety_escalation")


def make_evidence_example(rng: random.Random) -> dict:
    template, cite_ids = rng.choice(EVIDENCE_TEMPLATES)
    subj = rng.choice(SUBJECTS)
    opener = rng.choice(EVIDENCE_OPENERS)
    ctx = rng.choice(CONTEXTS)
    question = opener + template.format(subj=subj, subj_cap=subj.capitalize()) + ctx
    question = question.strip()
    block, chosen = _evidence_block(cite_ids)
    answer = _grounded_answer(question, chosen)
    user = (
        "Answer the caregiver using ONLY the evidence below. Cite each claim with its "
        "[Ex] tag. Do NOT give medical diagnosis or dosage advice.\n\n"
        f"Evidence:\n{block}\n\nCaregiver: {question}"
    )
    return _chat(user, answer, task="evidence_response")


def _chat(user: str, assistant: str, task: str) -> dict:
    return {
        "task": task,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user},
            {"role": "assistant", "content": assistant},
        ],
    }


# ── Optional paraphrase pass for linguistic diversity ────────────────────────

def paraphrase_messages(examples: list[dict], fraction: float) -> None:
    """In-place: rewrite the user message of a fraction of examples for diversity.
    Labels/assistant targets are untouched, so supervision stays correct."""
    if fraction <= 0:
        return
    try:
        from openai import OpenAI
    except Exception:
        print("[paraphrase] openai not installed — skipping")
        return
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        print("[paraphrase] OPENAI_API_KEY not set — skipping")
        return
    client = OpenAI(api_key=key)
    model = os.getenv("CHAT_MODEL", "gpt-4.1-mini")
    rng = random.Random(7)
    targets = [e for e in examples if e["task"] in ("tool_selection", "safety_escalation")
               and rng.random() < fraction]
    print(f"[paraphrase] rewriting {len(targets)} messages via {model} …")
    for i, ex in enumerate(targets):
        user_msg = ex["messages"][1]["content"]
        prefix, _, message = user_msg.partition("Message: ")
        if not message:
            continue
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content":
                    "Rewrite this caregiver message in a different natural voice "
                    "(vary phrasing, keep ALL medical facts and urgency identical, "
                    f"no names/phone/NRIC). Return only the rewrite:\n\n{message}"}],
            )
            new_msg = resp.choices[0].message.content.strip()
            ex["messages"][1]["content"] = f"{prefix}Message: {new_msg}"
        except Exception as exc:
            print(f"[paraphrase] item {i} failed: {exc.__class__.__name__}")
    print("[paraphrase] done")


# ── Main ─────────────────────────────────────────────────────────────────────

def _fill(maker, target: int, seen: set[str], rng: random.Random) -> list[dict]:
    """Draw unique examples from one maker up to `target`, giving up gracefully if
    the template space is exhausted so it can never starve the overall run."""
    rows, stale = [], 0
    budget = target * 60 + 500
    while len(rows) < target and budget > 0 and stale < target * 5 + 200:
        budget -= 1
        ex = maker(rng)
        key = ex["messages"][1]["content"] + "||" + ex["messages"][2]["content"]
        if key in seen:
            stale += 1
            continue
        stale = 0
        seen.add(key)
        rows.append(ex)
    return rows


def build(n: int, seed: int) -> list[dict]:
    rng = random.Random(seed)
    # Mix: 45% tool selection, 35% safety, 20% evidence — de-duplicated.
    q_tool = int(n * 0.45)
    q_safety = int(n * 0.35)
    q_evidence = n - q_tool - q_safety

    seen: set[str] = set()
    out: list[dict] = []
    out += _fill(make_tool_selection_example, q_tool, seen, rng)
    out += _fill(make_safety_example, q_safety, seen, rng)
    out += _fill(make_evidence_example, q_evidence, seen, rng)

    # If any task under-filled its unique space, top up from the others so we still
    # hit the requested total.
    topups = [make_tool_selection_example, make_safety_example, make_evidence_example]
    ti = 0
    while len(out) < n and ti < 3 * 4:
        out += _fill(topups[ti % 3], n - len(out), seen, rng)
        ti += 1
    return out


def write_splits(examples: list[dict], out_dir: Path, seed: int) -> None:
    rng = random.Random(seed)
    rng.shuffle(examples)
    n = len(examples)
    n_test = max(1, int(n * 0.08))
    n_val = max(1, int(n * 0.07))
    test, val, train = examples[:n_test], examples[n_test:n_test + n_val], examples[n_test + n_val:]
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, rows in [("train", train), ("val", val), ("test", test)]:
        path = out_dir / f"{name}.jsonl"
        with open(path, "w", encoding="utf-8") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        print(f"[write] {path}  ({len(rows)} examples)")
    # Task distribution report
    from collections import Counter
    dist = Counter(e["task"] for e in examples)
    print(f"[dist] {dict(dist)}  total={n}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=4000, help="total examples")
    ap.add_argument("--out", type=str, default="data", help="output dir")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--paraphrase", type=float, default=0.0,
                    help="fraction of messages to LLM-paraphrase (needs OPENAI_API_KEY)")
    args = ap.parse_args()

    examples = build(args.n, args.seed)
    paraphrase_messages(examples, args.paraphrase)
    write_splits(examples, _HERE / args.out, args.seed)


if __name__ == "__main__":
    main()
