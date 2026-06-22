"""
Audio Guide — ElevenLabs voice layer for CareKaki.

Receives a voice event + context, generates a short spoken script via OpenAI,
then converts it to audio via ElevenLabs. Returns raw audio bytes (mp3).

The voice does NOT make decisions — it narrates what CareKaki is doing.
"""

import os
import requests as http_requests
from openai import OpenAI

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "")
ELEVENLABS_MODEL_ID = os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")

_OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
_oai = OpenAI(api_key=_OPENAI_API_KEY) if _OPENAI_API_KEY else None

VOICE_PERSONA = """You are the CareKaki Audio Guide — a warm, calm, middle-aged care companion.

Rules:
- Speak like a friendly human, not a robot or doctor.
- Use simple everyday language. No jargon.
- Keep it under 3-4 sentences max.
- Say what is happening RIGHT NOW, not a recap of everything.
- Never diagnose, prescribe, or tell users to stop medication.
- Never mention APIs, databases, adapters, backends, or technical terms.
- Be reassuring and practical.
- For elderly users: be extra simple and gentle.
- For caregivers: you can be slightly more operational, but still plain language.
- After an edit or approval, keep it very short (1 sentence).
"""

EVENT_PROMPTS: dict[str, str] = {
    "guide_started": "The user just turned on Audio Guide Mode. Welcome them warmly in 1-2 sentences. Tell them you'll talk them through each step.",

    "profiling_question": "You need to ask the elderly person a simple care profiling question. Context: {context}. Ask ONE casual question to understand their situation. Keep it gentle.",

    "profile_updated": "The care profile was just updated with new information. Briefly acknowledge it in 1 sentence. Don't repeat the details.",

    "care_plan_created": "A care plan was just generated. Summarize it casually in 2-3 sentences. The plan details: {context}. Don't read it word-for-word — explain the big idea simply.",

    "care_plan_edit_requested": "The user asked to edit the care plan. Say something short like 'Got it, I'll update the plan for you.' — 1 sentence max.",

    "care_plan_edit_done": "The care plan was just updated after an edit. Say something short like 'Done, I've refreshed the plan.' — 1 sentence max.",

    "autopilot_explanation": "The autopilot is about to run these actions: {context}. Explain what will happen in 2-3 friendly sentences. Make clear nothing runs until they approve.",

    "autopilot_reexplain": "The care plan was edited, so the autopilot actions changed. Re-explain the new actions: {context}. Keep it to 2-3 sentences. Mention nothing runs until they approve.",

    "autopilot_approved": "The user just approved all actions. Say something short like 'Okay, working on it now.' — 1 sentence.",

    "autopilot_completed": "All autopilot actions finished. Say something short like 'Done, everything's been handled.' — 1 sentence.",

    "care_brief_ready": "The care brief is ready. Summarize it in 2-3 sentences: what happened, what was done, and what the next step is. Details: {context}. Sound like a calm handover.",
}


def generate_voice_script(event: str, context: str = "", mode: str = "caregiver") -> str:
    prompt_template = EVENT_PROMPTS.get(event)
    if not prompt_template:
        return ""

    prompt = prompt_template.replace("{context}", context)
    if mode == "self":
        prompt += "\nThe user is an elderly person — be extra simple, gentle, and reassuring."

    if not _oai:
        return prompt

    resp = _oai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": VOICE_PERSONA},
            {"role": "user", "content": prompt},
        ],
        max_tokens=200,
    )
    return resp.choices[0].message.content or ""


def text_to_speech(text: str) -> bytes | None:
    if not ELEVENLABS_API_KEY or not ELEVENLABS_VOICE_ID or not text.strip():
        return None

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": ELEVENLABS_MODEL_ID,
        "voice_settings": {
            "stability": 0.6,
            "similarity_boost": 0.75,
            "style": 0.3,
        },
    }

    resp = http_requests.post(url, json=payload, headers=headers, timeout=15)
    if resp.status_code == 200:
        return resp.content
    return None


def generate_voice_audio(event: str, context: str = "", mode: str = "caregiver") -> tuple[str, bytes | None]:
    script = generate_voice_script(event, context, mode)
    if not script:
        return "", None
    audio = text_to_speech(script)
    return script, audio
