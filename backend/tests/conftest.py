"""
Pytest configuration: adds the backend package root to sys.path and stubs out
google.generativeai so tests can import main.py without the SDK installed.
"""

import sys
import os
from unittest.mock import MagicMock

# ── path ──────────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ── stub google.generativeai before any import touches it ────────────────────
# The SDK is not installed in the test environment; we only want to exercise
# the FastAPI routing and business logic, not real LLM calls.
_genai_stub = MagicMock()
_genai_stub.GenerativeModel.return_value = MagicMock()
sys.modules.setdefault("google", MagicMock())
sys.modules.setdefault("google.generativeai", _genai_stub)
sys.modules["google"].generativeai = _genai_stub
