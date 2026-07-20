"""Shared LLM client + prompt/language helpers for the CareKaki agent.

Single source of truth so both the LangGraph nodes and any legacy call sites use
the same client, model, and language instructions. The client is constructed
lazily: with no OPENAI_API_KEY the server still boots and the graph degrades to a
rule-based offline path (emergency detection, adapter planning, and Guardian all
run without the LLM).
"""

import os

from openai import OpenAI

_OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# When FINETUNED_MODEL_BASE_URL is set (e.g. a local vLLM server hosting the
# fine-tuned Qwen2.5-1.5B), the agent talks to it through the same OpenAI-
# compatible interface. Otherwise it falls back to the hosted model.
_FT_BASE_URL = os.getenv("FINETUNED_MODEL_BASE_URL")
_FT_MODEL = os.getenv("FINETUNED_MODEL_NAME")

if _FT_BASE_URL:
    # vLLM's OpenAI-compatible server ignores the key but the client requires one.
    oai = OpenAI(base_url=_FT_BASE_URL, api_key=os.getenv("OPENAI_API_KEY") or "sk-local")
    CHAT_MODEL = _FT_MODEL or "carekaki-qwen2.5-1.5b"
elif _OPENAI_API_KEY:
    oai = OpenAI(api_key=_OPENAI_API_KEY)
    CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4.1-mini")
else:
    oai = None
    CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4.1-mini")


SYSTEM_PROMPT = """You are CareKaki, a care navigator helping families in Singapore
navigate community care services. You ask short, empathetic questions to understand
the patient's situation — their living arrangements, mobility, conditions, caregiver
situation, and financial tier. Keep responses concise and conversational."""

# Reply-language instructions, keyed by the frontend's language code. Brand and
# scheme names (AiMao, CareKaki, Guardian, CHAS, MediFund, SingPass, ICCP…)
# always stay in English.
LANGUAGE_INSTRUCTIONS = {
    "zh": "\n\nReply entirely in Simplified Chinese (简体中文), in a warm everyday tone. "
          "Keep the names 'AiMao', 'CareKaki', 'Guardian' and Singapore scheme names "
          "(CHAS, MediFund, SingPass, ICCP) in English.",
    "ms": "\n\nReply entirely in Bahasa Melayu, in a warm everyday tone. "
          "Keep the names 'AiMao', 'CareKaki', 'Guardian' and Singapore scheme names "
          "(CHAS, MediFund, SingPass, ICCP) in English.",
}

EXTRACTION_PROMPT = """Extract any care profile fields you can confidently identify
from this conversation. Return only a JSON object with these fields (omit fields you
are not confident about):
name, age, living, mobility, conditions, caregiver, financialTier, recentEvent"""


def with_language(prompt: str, language: str) -> str:
    return prompt + LANGUAGE_INSTRUCTIONS.get(language, "")
