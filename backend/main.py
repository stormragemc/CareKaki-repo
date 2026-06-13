import os
import json
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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


@app.get("/")
def check():
    return {"status": "Backend running"}


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
