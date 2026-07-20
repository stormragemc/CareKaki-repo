"""CareKaki care-navigation graph, built on LangGraph.

The graph makes the orchestration explicit and inspectable instead of a straight
line of imperative OpenAI calls:

    START → intake → triage → (respond ∥ nothing) → plan → guardian → END
                                   │
                    conditional on risk level

Nodes
-----
intake   : extract structured care-profile fields from the conversation (LLM, JSON)
triage   : classify risk signal (high/medium/low) + emergency flag  (deterministic)
respond  : generate the empathetic navigator reply                  (LLM)
plan     : select which downstream adapters should fire             (deterministic)
guardian : apply PDPA redaction, no-medical-advice + human-gate     (deterministic)

Every node reads and writes a shared `CareState`. The whole thing degrades
gracefully with no OPENAI_API_KEY: intake/respond become no-ops and the
deterministic triage/plan/guardian path still runs.
"""

from __future__ import annotations

import json
from typing import TypedDict

from langgraph.graph import StateGraph, START, END

from services.guardian import guardian_check
from .llm import (
    oai,
    CHAT_MODEL,
    SYSTEM_PROMPT,
    EXTRACTION_PROMPT,
    with_language,
)
from .triage import classify_risk, detect_emergency, plan_adapters


class CareState(TypedDict, total=False):
    # Inputs
    messages: list[dict]        # [{"role": "user"|"assistant", "content": str}]
    language: str
    # Derived
    last_message: str
    profile_update: dict
    risk_level: str             # "high" | "medium" | "low"
    emergency: bool
    reply: str
    adapters: list[str]
    guardian: dict
    safe_reply: str


def _to_openai_messages(messages: list[dict], system_prompt: str = "") -> list[dict]:
    msgs: list[dict] = []
    if system_prompt:
        msgs.append({"role": "system", "content": system_prompt})
    for m in messages:
        role = "user" if m.get("role") == "user" else "assistant"
        msgs.append({"role": role, "content": m.get("content", "")})
    return msgs


# ── Nodes ────────────────────────────────────────────────────────────────────

def intake_node(state: CareState) -> CareState:
    """Pull structured profile fields out of the conversation so far."""
    messages = state["messages"]
    state["last_message"] = messages[-1]["content"] if messages else ""

    if oai is None:
        return {"profile_update": {}, "last_message": state["last_message"]}

    role_label = {"user": "Patient", "assistant": "CareKaki"}
    conversation_text = "\n".join(
        f"{role_label.get(m.get('role'), m.get('role'))}: {m.get('content', '')}"
        for m in messages
    )
    try:
        resp = oai.chat.completions.create(
            model=CHAT_MODEL,
            messages=[{
                "role": "user",
                "content": f"{EXTRACTION_PROMPT}\n\nConversation:\n{conversation_text}",
            }],
            response_format={"type": "json_object"},
        )
        profile_update = json.loads(resp.choices[0].message.content)
    except Exception:
        profile_update = {}
    return {"profile_update": profile_update, "last_message": state["last_message"]}


def triage_node(state: CareState) -> CareState:
    """Deterministic risk-signal classification — the 'early risk signal' surface."""
    text = state.get("last_message", "")
    risk = classify_risk(text)
    return {"risk_level": risk, "emergency": detect_emergency(text)}


def respond_node(state: CareState) -> CareState:
    """Generate the empathetic navigator reply in the requested language."""
    if oai is None:
        return {"reply": "CareKaki is running in offline mode — set OPENAI_API_KEY for live replies."}

    language = state.get("language", "en")
    chat_messages = _to_openai_messages(
        state["messages"], with_language(SYSTEM_PROMPT, language)
    )
    try:
        resp = oai.chat.completions.create(model=CHAT_MODEL, messages=chat_messages)
        reply = resp.choices[0].message.content
    except Exception as exc:  # keep the turn alive even if the LLM call fails
        reply = f"CareKaki hit a temporary issue generating a reply ({exc.__class__.__name__})."
    return {"reply": reply}


def plan_node(state: CareState) -> CareState:
    """Select downstream adapters when the turn is an emergency; else none."""
    if state.get("emergency"):
        return {"adapters": plan_adapters(state.get("last_message", ""))}
    return {"adapters": []}


def guardian_node(state: CareState) -> CareState:
    """Responsible-AI pass: PDPA redaction, no-medical-advice, human-gate."""
    reply = state.get("reply", "")
    guardian = guardian_check(reply, adapter_name="chat", data_sources=["llm"])
    safe_reply = guardian["safe_text"]
    if guardian["medical_disclaimer"]:
        safe_reply += f"\n\n{guardian['medical_disclaimer']}"
    return {"guardian": guardian, "safe_reply": safe_reply}


# ── Graph assembly ───────────────────────────────────────────────────────────

def _build_graph():
    g = StateGraph(CareState)
    g.add_node("intake", intake_node)
    g.add_node("triage", triage_node)
    g.add_node("respond", respond_node)
    g.add_node("plan", plan_node)
    g.add_node("guardian", guardian_node)

    g.add_edge(START, "intake")
    g.add_edge("intake", "triage")
    g.add_edge("triage", "respond")
    g.add_edge("respond", "plan")
    g.add_edge("plan", "guardian")
    g.add_edge("guardian", END)
    return g.compile()


care_graph = _build_graph()


def run_care_turn(messages: list[dict], language: str = "en") -> dict:
    """Execute one full pass of the care graph and return the /chat response shape."""
    final: CareState = care_graph.invoke({"messages": messages, "language": language})
    return {
        "content": final.get("safe_reply", ""),
        "profileUpdate": final.get("profile_update", {}),
        "emergency": final.get("emergency", False),
        "riskLevel": final.get("risk_level", "low"),
        "adapters": final.get("adapters", []),
        "guardian": {"flags": final.get("guardian", {}).get("flags", [])},
    }
