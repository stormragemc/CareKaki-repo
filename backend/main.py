import os
import json
import requests
from datetime import datetime
from openai import OpenAI
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Construct the client lazily: the OpenAI v1 client raises if no key is present,
# which would block the whole server from booting. Without a key the server still
# runs — Guardian, health, and the keyword-based emergency/adapter logic all work
# offline; only the LLM-backed replies degrade gracefully.
_OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
oai = OpenAI(api_key=_OPENAI_API_KEY) if _OPENAI_API_KEY else None
CHAT_MODEL = "gpt-4o-mini"

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

ICCP_BOT_TOKEN = os.getenv("ICCP_BOT_TELEGRAM_TOKEN")
ICCP_API = f"https://api.telegram.org/bot{ICCP_BOT_TOKEN}"

# Public HTTPS base (e.g. the ngrok tunnel) Telegram should call back on. When set,
# the backend points both bots' webhooks here on startup so no manual setWebhook /
# "telegram connect link" step is needed. Leave blank for the keyless demo.
PUBLIC_BASE_URL = (os.getenv("PUBLIC_BASE_URL") or "").rstrip("/")

# Hackathon-simple in-memory state (resets when server restarts)
caregiver_chat_id: int | None = None
telegram_log: list[dict] = []

coordinator_chat_id: int | None = None
iccp_log: list[dict] = []
iccp_cases: dict = {}
medication_log: list[dict] = []


def log_telegram(from_: str, text: str, buttons: list[str] | None = None):
    telegram_log.append({
        "from": from_,
        "text": text,
        "buttons": buttons,
        "time": datetime.now().strftime("%I:%M %p"),
    })


def log_medication(from_: str, text: str, tone: str = "default"):
    medication_log.append({
        "from": from_,
        "text": text,
        "tone": tone,
        "time": datetime.now().strftime("%I:%M %p"),
    })


def log_iccp(from_: str, text: str, tone: str = "default", buttons: list[str] | None = None):
    iccp_log.append({
        "from": from_,
        "text": text,
        "tone": tone,
        "buttons": buttons,
        "time": datetime.now().strftime("%I:%M %p"),
    })

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _register_webhook(api_base: str, token: str | None, path: str) -> None:
    """Point a bot's webhook at PUBLIC_BASE_URL + path. Best-effort: a network
    blip or a sleeping tunnel shouldn't stop the server from booting."""
    if not token:
        return
    url = f"{PUBLIC_BASE_URL}{path}"
    try:
        resp = requests.post(f"{api_base}/setWebhook", data={"url": url}, timeout=10)
        ok = resp.ok and resp.json().get("ok")
        print(f"[webhook] setWebhook {url} -> {'ok' if ok else resp.text}")
    except Exception as exc:  # noqa: BLE001 — never block startup on Telegram
        print(f"[webhook] setWebhook {url} failed: {exc}")


@app.on_event("startup")
def register_telegram_webhooks() -> None:
    if not PUBLIC_BASE_URL or PUBLIC_BASE_URL in ("https://", "http://"):
        print("[webhook] PUBLIC_BASE_URL not set — skipping webhook registration")
        return
    _register_webhook(TELEGRAM_API, TELEGRAM_BOT_TOKEN, "/telegram/webhook")
    _register_webhook(ICCP_API, ICCP_BOT_TOKEN, "/iccp/webhook")

SYSTEM_PROMPT = """You are CareKaki, a care navigator helping families in Singapore
navigate community care services. You ask short, empathetic questions to understand
the patient's situation — their living arrangements, mobility, conditions, caregiver
situation, and financial tier. Keep responses concise and conversational."""

EXTRACTION_PROMPT = """Extract any care profile fields you can confidently identify
from this conversation. Return only a JSON object with these fields (omit fields you
are not confident about):
name, age, living, mobility, conditions, caregiver, financialTier, recentEvent"""

PATHWAY_PROMPT = """Based on the care profile below, generate a personalised care
pathway for a family in Singapore. Return only a JSON array of exactly 4 objects,
each with these fields:
- id: short kebab-case string
- timeframe: one of "THIS WEEK", "WEEKS 2-8", "APPLY NOW", "SINGLE POINT"
- title: short title for this stage
- colorScheme: one of "orange", "blue", "amber", "teal" (match timeframe order above)
- items: array of 3 short actionable strings
- whyThisForYou: one sentence explaining why this applies to this specific person

Base every item on the actual profile details given — living situation, mobility,
conditions, caregiver capacity, and financial tier."""

CLASSIFY_PROMPT = """A caregiver replied to an emergency alert about their family
member. Classify their message and return only a JSON object with these fields:
- intent: one of "caregiver_responding", "asking_question", "unclear"
- status: one of "on_the_way", "cannot_go", "delegating", "unknown"
- eta_minutes: number or null
- extra_request: short string describing any extra request, or null
- urgency: one of "low", "medium", "high"

Caregiver message: """

EMERGENCY_KEYWORDS = [
    "fall", "fell", "collapsed", "collapse", "unconscious", "unresponsive",
    "chest pain", "heart attack", "stroke", "seizure", "choking",
    "bleeding", "can't breathe", "cannot breathe", "shortness of breath",
    "emergency", "ambulance", "999", "995", "help now", "urgent",
    "hit head", "head injury", "broken", "fracture",
    "not moving", "not breathing", "fainted", "passed out",
]


def detect_emergency(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in EMERGENCY_KEYWORDS)


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


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


class PathwayRequest(BaseModel):
    profile: dict


def to_openai_messages(messages: list[Message], system_prompt: str = ""):
    msgs = []
    if system_prompt:
        msgs.append({"role": "system", "content": system_prompt})
    for msg in messages:
        role = "user" if msg.role == "user" else "assistant"
        msgs.append({"role": role, "content": msg.content})
    return msgs


def send_telegram_message(chat_id: int, text: str, buttons: list[list[str]] | None = None):
    payload = {"chat_id": chat_id, "text": text}
    if buttons:
        payload["reply_markup"] = json.dumps({
            "inline_keyboard": [
                [{"text": label, "callback_data": label} for label in row]
                for row in buttons
            ]
        })
    requests.post(f"{TELEGRAM_API}/sendMessage", data=payload)


def send_iccp_message(chat_id: int, text: str, buttons: list[list[str]] | None = None):
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if buttons:
        payload["reply_markup"] = json.dumps({
            "inline_keyboard": [
                [{"text": label, "callback_data": label} for label in row]
                for row in buttons
            ]
        })
    requests.post(f"{ICCP_API}/sendMessage", data=payload)


@app.get("/")
def check():
    return {"status": "Backend running"}


@app.get("/telegram/log")
def get_telegram_log():
    return {"log": telegram_log}


@app.post("/chat")
def chat(request: ChatRequest):
    last_message = request.messages[-1].content

    if oai is None:
        # Offline mode (no OPENAI_API_KEY): no LLM reply or extraction, but the
        # safety + emergency routing below are rule-based and still work.
        reply = "CareKaki is running in offline mode — set OPENAI_API_KEY for live replies."
        profile_update = {}
    else:
        # Main chat response
        chat_messages = to_openai_messages(request.messages, SYSTEM_PROMPT)
        chat_resp = oai.chat.completions.create(
            model=CHAT_MODEL,
            messages=chat_messages,
        )
        reply = chat_resp.choices[0].message.content

        # Profile extraction
        role_label = {"user": "Patient", "assistant": "CareKaki"}
        conversation_text = "\n".join(
            f"{role_label.get(m.role, m.role)}: {m.content}" for m in request.messages
        )
        extraction_resp = oai.chat.completions.create(
            model=CHAT_MODEL,
            messages=[{"role": "user", "content": f"{EXTRACTION_PROMPT}\n\nConversation:\n{conversation_text}"}],
            response_format={"type": "json_object"},
        )

        try:
            profile_update = json.loads(extraction_resp.choices[0].message.content)
        except Exception:
            profile_update = {}

    guardian = guardian_check(reply, adapter_name="chat", data_sources=["openai"])
    safe_reply = guardian["safe_text"]
    if guardian["medical_disclaimer"]:
        safe_reply += f"\n\n{guardian['medical_disclaimer']}"

    is_emergency = detect_emergency(last_message)
    adapters = plan_adapters(last_message) if is_emergency else []

    return {
        "content": safe_reply,
        "profileUpdate": profile_update,
        "emergency": is_emergency,
        "adapters": adapters,
        "guardian": {"flags": guardian["flags"]},
    }


@app.post("/pathway")
def pathway(request: PathwayRequest):
    if oai is None:
        return {"columns": []}

    prompt = f"{PATHWAY_PROMPT}\n\nCare profile:\n{json.dumps(request.profile)}"

    resp = oai.chat.completions.create(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    try:
        raw = json.loads(resp.choices[0].message.content)
        if isinstance(raw, list):
            columns = raw
        elif isinstance(raw, dict):
            columns = next((v for v in raw.values() if isinstance(v, list)), [])
        else:
            columns = []
    except Exception:
        columns = []

    return {"columns": columns}


class EmergencyAlert(BaseModel):
    message: str


@app.post("/carekaki/emergency-alert")
def emergency_alert(request: EmergencyAlert):
    if not caregiver_chat_id:
        return {"ok": False, "error": "No caregiver has /start'd the bot yet"}

    buttons = ["I'm going now", "Call ambulance", "Ask neighbor", "Escalate"]
    send_telegram_message(
        caregiver_chat_id,
        request.message,
        buttons=[buttons[:2], buttons[2:]],
    )
    log_telegram("bot", request.message, buttons=buttons)
    return {"ok": True}


@app.post("/telegram/webhook")
async def telegram_webhook(request: Request):
    global caregiver_chat_id
    update = await request.json()

    # /start — store the chat_id so we know where to send alerts
    if "message" in update and update["message"].get("text") == "/start":
        caregiver_chat_id = update["message"]["chat"]["id"]
        send_telegram_message(caregiver_chat_id, "CareKaki connected. You'll receive alerts here.")
        return {"ok": True}

    # Button tap — direct mapping, no LLM needed
    if "callback_query" in update:
        query = update["callback_query"]
        chat_id = query["message"]["chat"]["id"]
        choice = query["data"]

        replies = {
            "I'm going now": "Got it — marked you as the responder. Stay safe!",
            "Call ambulance": "Okay — please call 995 now if it's serious.",
            "Ask neighbor": "Understood — let us know once a neighbor confirms.",
            "Escalate": "Escalating to the ICCP coordinator now.",
        }
        log_telegram("user", choice)
        reply_text = replies.get(choice, "Got it, thanks!")
        send_telegram_message(chat_id, reply_text)
        log_telegram("bot", reply_text)
        return {"ok": True}

    # Free-text reply — send to OpenAI for classification
    if "message" in update and "text" in update["message"]:
        chat_id = update["message"]["chat"]["id"]
        text = update["message"]["text"]
        log_telegram("user", text)

        if oai is None:
            ack = "Thanks for your message — a coordinator will follow up."
            send_telegram_message(chat_id, ack)
            log_telegram("bot", ack)
            return {"ok": True}

        classify_resp = oai.chat.completions.create(
            model=CHAT_MODEL,
            messages=[{"role": "user", "content": f"{CLASSIFY_PROMPT}{text}"}],
            response_format={"type": "json_object"},
        )

        try:
            result = json.loads(classify_resp.choices[0].message.content)
        except Exception:
            result = {}

        eta = result.get("eta_minutes")
        extra = result.get("extra_request")

        reply_parts = ["Got it."]
        if eta:
            reply_parts.append(f"I've marked you as the primary responder with ETA {eta} minutes.")
        if extra:
            reply_parts.append(f"I'll also help with: {extra}.")

        reply_text = " ".join(reply_parts)
        send_telegram_message(chat_id, reply_text)
        log_telegram("bot", reply_text)
        return {"ok": True, "classification": result}

    return {"ok": True}


# ── AIC-style eldercare recommendation adapter ──────────────────────────────

from services.aic_adapter import recommend_aic_services
from services.nursing_adapter import recommend_nursing_providers
from services.medication_adapter import build_medication_review_packet, format_packet_for_telegram
from services.guardian import guardian_check


class AICRecommendRequest(BaseModel):
    care_need: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    limit: int = 3


@app.post("/integrations/aic/recommend")
def aic_recommend(req: AICRecommendRequest):
    return recommend_aic_services(
        care_need=req.care_need,
        user_latitude=req.latitude,
        user_longitude=req.longitude,
        limit=req.limit,
    )


class NursingRecommendRequest(BaseModel):
    care_need: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    limit: int = 3


@app.post("/integrations/nursing/recommend")
def nursing_recommend(req: NursingRecommendRequest):
    return recommend_nursing_providers(
        care_need=req.care_need,
        user_latitude=req.latitude,
        user_longitude=req.longitude,
        limit=req.limit,
    )


# ── ICCP-style coordinator handover ─────────────────────────────────────────


class HandoverRequest(BaseModel):
    patient_name: str
    age: int
    issue: str
    risk: str = "High"
    suggested_action: str = "Urgent family check-in + clinic follow-up"


@app.get("/iccp/log")
def get_iccp_log():
    return {"log": iccp_log}


@app.post("/integrations/iccp/handover")
def iccp_handover(req: HandoverRequest):
    if not coordinator_chat_id:
        return {"ok": False, "error": "No coordinator group has sent /coordinator yet"}

    case_id = f"CK-{datetime.now().strftime('%H%M%S')}"
    iccp_cases[case_id] = {
        "patient": req.patient_name,
        "age": req.age,
        "issue": req.issue,
        "risk": req.risk,
        "status": "pending",
        "created": datetime.now().strftime("%I:%M %p"),
    }

    log_iccp("system", f"Case packet assembled for {req.patient_name}", tone="success")
    log_iccp("system", f"Case {case_id} — Risk: {req.risk}", tone="success")

    message = (
        f"<b>New ICCP-style Handover</b>\n\n"
        f"<b>Case:</b> {case_id}\n"
        f"<b>Patient:</b> {req.patient_name}, {req.age}\n"
        f"<b>Issue:</b> {req.issue}\n"
        f"<b>Risk:</b> {req.risk}\n"
        f"<b>Suggested action:</b> {req.suggested_action}\n\n"
        f"Please respond below."
    )

    buttons = ["Accept Case", "Request More Info", "Escalate"]
    send_iccp_message(
        coordinator_chat_id,
        message,
        buttons=[buttons],
    )
    log_iccp("bot", f"Handover sent to coordinator group", tone="success")
    log_iccp("system", f"Awaiting coordinator response…", tone="pending")

    return {"ok": True, "case_id": case_id}


@app.post("/iccp/webhook")
async def iccp_webhook(request: Request):
    global coordinator_chat_id
    update = await request.json()

    # /coordinator — register the coordinator group
    if "message" in update and update["message"].get("text") == "/coordinator":
        coordinator_chat_id = update["message"]["chat"]["id"]
        send_iccp_message(coordinator_chat_id, "ICCP Coordinator channel registered. Case handovers will appear here.")
        log_iccp("system", "Coordinator channel connected", tone="success")
        return {"ok": True}

    # /start in DM
    if "message" in update and update["message"].get("text") == "/start":
        chat_id = update["message"]["chat"]["id"]
        coordinator_chat_id = chat_id
        send_iccp_message(chat_id, "ICCP Coordinator bot connected. Send /coordinator in a group to register the coordinator channel, or use this DM.")
        log_iccp("system", "Coordinator connected via DM", tone="success")
        return {"ok": True}

    # Button tap from coordinator
    if "callback_query" in update:
        query = update["callback_query"]
        chat_id = query["message"]["chat"]["id"]
        choice = query["data"]
        user_name = query["from"].get("first_name", "Coordinator")

        if choice == "Accept Case":
            reply = f"{user_name} accepted the case. Follow-up in progress."
            log_iccp("user", f"{user_name}: Accepted case", tone="success")
            log_iccp("system", "Case status → In Progress", tone="success")
        elif choice == "Request More Info":
            reply = f"{user_name} requested more info. CareKaki will provide additional details."
            log_iccp("user", f"{user_name}: Requested more info", tone="default")
            log_iccp("system", "Gathering additional patient info…", tone="pending")
        elif choice == "Escalate":
            reply = f"{user_name} escalated the case. Alerting senior coordinator."
            log_iccp("user", f"{user_name}: Escalated", tone="default")
            log_iccp("system", "Case escalated to senior coordinator", tone="pending")
        elif choice == "Accept Review":
            reply = f"{user_name} accepted the medication review. Please type your recommendation in this group."
            log_medication("user", f"{user_name}: Accepted review", tone="success")
            log_medication("system", "Pharmacy review in progress — awaiting recommendation", tone="pending")
        elif choice == "Request More Info":
            reply = "Please specify what additional information is needed from the caregiver."
            log_medication("user", f"{user_name}: Requested more info", tone="default")
            log_medication("system", "Pharmacy requested additional info", tone="pending")
        elif choice == "Mark Urgent":
            reply = f"Marked as urgent by {user_name}. CareKaki will escalate this case."
            log_medication("user", f"{user_name}: Marked urgent", tone="default")
            log_medication("system", "Case escalated — urgent pharmacy flag", tone="pending")
        else:
            reply = "Noted."
            log_iccp("user", f"{user_name}: {choice}", tone="default")

        send_iccp_message(chat_id, reply)
        log_iccp("bot", reply, tone="success")
        return {"ok": True}

    # Free-text reply from coordinator
    if "message" in update and "text" in update["message"]:
        chat_id = update["message"]["chat"]["id"]
        text = update["message"]["text"]
        user_name = update["message"]["from"].get("first_name", "Coordinator")
        log_iccp("user", f"{user_name}: {text}")

        reply = f"Noted — coordinator message logged. CareKaki will update the case accordingly."
        send_iccp_message(chat_id, reply)
        log_iccp("bot", reply, tone="success")
        return {"ok": True}

    return {"ok": True}


# ── Medication Review Support Adapter ────────────────────────────────────────


class MedicationReviewRequest(BaseModel):
    senior_name: str
    age: int
    medications: list[str] | None = None
    symptom: str = ""
    context: str = ""
    raw_message: str = ""


@app.get("/medication/log")
def get_medication_log():
    return {"log": medication_log}


@app.post("/integrations/medication-review/request")
def medication_review(req: MedicationReviewRequest):
    log_medication("system", f"Medication review requested for {req.senior_name}", tone="success")
    log_medication("system", "Extracting medication names…", tone="success")

    packet = build_medication_review_packet(
        senior_name=req.senior_name,
        age=req.age,
        medications=req.medications,
        symptom=req.symptom,
        context=req.context,
        raw_message=req.raw_message,
    )

    log_medication("system", f"Found medications: {', '.join(packet['medications'])}", tone="success")
    log_medication("system", f"HSA lookup complete — {sum(1 for v in packet['hsa_matches'].values() if v)} matched", tone="success")
    log_medication("system", f"openFDA enrichment complete", tone="success")
    log_medication("system", f"Risk level: {packet['risk_level'].upper()}", tone="success" if packet["risk_level"] == "low" else "pending")

    if coordinator_chat_id:
        telegram_text = format_packet_for_telegram(packet)
        buttons = ["Accept Review", "Request More Info", "Mark Urgent"]
        send_iccp_message(
            coordinator_chat_id,
            telegram_text,
            buttons=[buttons],
        )
        log_medication("bot", "Review packet sent to Pharmacy Desk", tone="success")
        log_medication("system", "Awaiting pharmacy response…", tone="pending")
        packet["telegram_sent"] = True
    else:
        log_medication("system", "No pharmacy group registered — packet stored locally only", tone="pending")
        packet["telegram_sent"] = False

    return packet


# ── Guardian demo endpoint ───────────────────────────────────────────────────


class GuardianCheckRequest(BaseModel):
    text: str
    adapter_name: str = ""
    data_sources: list[str] = []


@app.post("/guardian/check")
def guardian_demo(req: GuardianCheckRequest):
    return guardian_check(req.text, req.adapter_name, req.data_sources)


# ── Autopilot plan endpoints ────────────────────────────────────────────────

ADAPTER_META: dict[str, dict] = {
    "iccp": {"title": "ICCP Coordinator", "description": "Assemble case packet and hand over to a care coordinator", "icon": "coordinator"},
    "nursing": {"title": "HomeNursing.sg", "description": "Search nearby providers, check availability, and create a tentative booking", "icon": "nursing"},
    "aic": {"title": "AIC Eldercare", "description": "Search eldercare services and recommend nearest support centres", "icon": "eldercare"},
    "medication": {"title": "Medication Review", "description": "Look up HSA + openFDA data, flag risks, and route to pharmacy desk", "icon": "medication"},
    "telegram": {"title": "Caregiver Alert", "description": "Send emergency alert to caregiver via Telegram with response options", "icon": "telegram"},
}


class PlanAdaptersRequest(BaseModel):
    text: str


@app.post("/autopilot/plan")
def autopilot_plan(req: PlanAdaptersRequest):
    return {"adapters": plan_adapters(req.text)}


class GeneratePlanRequest(BaseModel):
    care_need: str
    profile: dict | None = None


@app.post("/autopilot/generate-plan")
def generate_autopilot_plan(req: GeneratePlanRequest):
    adapters = plan_adapters(req.care_need)
    steps = []
    for i, adapter_id in enumerate(adapters):
        meta = ADAPTER_META.get(adapter_id, {})
        steps.append({
            "id": adapter_id,
            "order": i + 1,
            "title": meta.get("title", adapter_id),
            "description": meta.get("description", ""),
            "icon": meta.get("icon", "default"),
            "execution": "simultaneous",
        })
    return {"care_need": req.care_need, "steps": steps, "execution_mode": "simultaneous", "total_steps": len(steps)}


class EditPlanRequest(BaseModel):
    care_need: str
    current_steps: list[dict]
    feedback: str


@app.post("/autopilot/edit-plan")
def edit_autopilot_plan(req: EditPlanRequest):
    current_ids = [s["id"] for s in req.current_steps]
    feedback_lower = req.feedback.lower()

    remove_map = {
        "iccp": ["coordinator", "iccp", "handover", "case"],
        "nursing": ["nursing", "provider", "booking", "clinic", "home care"],
        "aic": ["aic", "eldercare", "grant", "activity centre", "senior"],
        "medication": ["medication", "medicine", "pharmacy", "drug", "pill"],
        "telegram": ["telegram", "alert", "notification", "caregiver alert"],
    }

    removal_phrases = ["don't", "dont", "remove", "skip", "no need", "i'll do", "ill do", "i will do", "not needed", "take out", "exclude", "drop"]
    wants_removal = any(p in feedback_lower for p in removal_phrases)

    new_ids = list(current_ids)
    if wants_removal:
        for adapter_id, keywords in remove_map.items():
            if adapter_id in new_ids and any(kw in feedback_lower for kw in keywords):
                new_ids.remove(adapter_id)

    add_phrases = ["add", "include", "also run", "also do", "need"]
    wants_add = any(p in feedback_lower for p in add_phrases)
    if wants_add:
        for adapter_id, keywords in remove_map.items():
            if adapter_id not in new_ids and any(kw in feedback_lower for kw in keywords):
                new_ids.append(adapter_id)

    steps = []
    for i, adapter_id in enumerate(new_ids):
        meta = ADAPTER_META.get(adapter_id, {})
        steps.append({
            "id": adapter_id,
            "order": i + 1,
            "title": meta.get("title", adapter_id),
            "description": meta.get("description", ""),
            "icon": meta.get("icon", "default"),
            "execution": "simultaneous",
        })

    return {"care_need": req.care_need, "steps": steps, "execution_mode": "simultaneous", "total_steps": len(steps), "edited": True}


class PathwayEditRequest(BaseModel):
    profile: dict
    current_columns: list[dict]
    feedback: str


@app.post("/pathway/edit")
def pathway_edit(req: PathwayEditRequest):
    if oai is None:
        return {"columns": req.current_columns}

    prompt = (
        f"{PATHWAY_PROMPT}\n\n"
        f"Care profile:\n{json.dumps(req.profile)}\n\n"
        f"Current care plan:\n{json.dumps(req.current_columns)}\n\n"
        f"The caregiver wants the following change:\n{req.feedback}\n\n"
        f"Regenerate the full care plan with this change applied. Return the updated JSON array."
    )
    resp = oai.chat.completions.create(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    try:
        raw = json.loads(resp.choices[0].message.content)
        if isinstance(raw, list):
            columns = raw
        elif isinstance(raw, dict):
            columns = next((v for v in raw.values() if isinstance(v, list)), [])
        else:
            columns = []
    except Exception:
        columns = req.current_columns
    return {"columns": columns}
