"""CareKaki agent package — LangGraph orchestration for the care-navigation flow.

The public surface is intentionally tiny: `run_care_turn` executes one full pass of
the care graph (intake → triage → respond → plan → guardian) and returns the same
shape the /chat endpoint has always returned, so the HTTP layer stays unchanged.
"""

from .graph import run_care_turn, care_graph

__all__ = ["run_care_turn", "care_graph"]
