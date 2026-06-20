"""
Pytest configuration: adds the backend package root to sys.path.

main.py constructs the OpenAI client lazily (oai = None when no key is set),
so the server can be imported without a real API key — no stubbing required.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
