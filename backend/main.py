import os
import json
import requests
from datetime import datetime
import google.generativeai as genai
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

# Hackathon-simple in-memory state (resets when server restarts)
caregiver_chat_id: int | None = None
telegram_log: list[dict] = []


def log_telegram(from_: str, text: str, buttons: list[str] | None = None):
    telegram_log.append({
        "from": from_,           # "bot" or "user"
        "text": text,
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

chat_model = genai.GenerativeModel(
    model_name="gemini-3.5-flash",
    system_instruction=SYSTEM_PROMPT,
)

extraction_model = genai.GenerativeModel(
    model_name="gemini-3.1-flash-lite",
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


class PathwayRequest(BaseModel):
    profile: dict


def to_gemini_history(messages: list[Message]):
    return [
        {
            "role": "user" if msg.role == "user" else "model",
            "parts": [msg.content],
        }
        for msg in messages
    ]


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


@app.get("/")
def check():
    return {"status": "Backend running"}


@app.get("/telegram/log")
def get_telegram_log():
    return {"log": telegram_log}


@app.post("/chat")
def chat(request: ChatRequest):
    history = to_gemini_history(request.messages[:-1])
    last_message = request.messages[-1].content

    # Main chat response
    session = chat_model.start_chat(history=history)
    response = session.send_message(last_message)
    reply = response.text

    # Profile extraction using cheaper model
    conversation_text = "\n".join(
        f"{m.role}: {m.content}" for m in request.messages
    )
    extraction = extraction_model.generate_content(
        f"{EXTRACTION_PROMPT}\n\nConversation:\n{conversation_text}",
        generation_config={"response_mime_type": "application/json"},
    )

    try:
        profile_update = json.loads(extraction.text)
    except Exception:
        profile_update = {}

    return {"content": reply, "profileUpdate": profile_update}


@app.post("/pathway")
def pathway(request: PathwayRequest):
    prompt = f"{PATHWAY_PROMPT}\n\nCare profile:\n{json.dumps(request.profile)}"

    response = chat_model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"},
    )

    try:
        columns = json.loads(response.text)
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

    # Free-text reply — send to Gemini for classification
    if "message" in update and "text" in update["message"]:
        chat_id = update["message"]["chat"]["id"]
        text = update["message"]["text"]
        log_telegram("user", text)

        classification = extraction_model.generate_content(
            f"{CLASSIFY_PROMPT}{text}",
            generation_config={"response_mime_type": "application/json"},
        )

        try:
            result = json.loads(classification.text)
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
