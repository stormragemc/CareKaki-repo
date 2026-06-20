"""
Unit tests for services/guardian.py — CareKaki's Responsible-AI safety layer.

The Guardian is fully deterministic with no external dependencies.
Actual API: guardian_check(text, adapter_name="", data_sources=None) → dict with:
  safe_text, original_redacted, medical_disclaimer, requires_confirmation,
  risky_actions, traceability, flags, flag_count, passed
PII is tokenised in safe_text (not blocked); medical advice adds a disclaimer.
"""

import pytest
from services.guardian import (
    guardian_check,
    redact_pdpa,
    check_medical_advice,
    check_human_gate,
    add_traceability,
)


# ── redact_pdpa ───────────────────────────────────────────────────────────────

class TestRedactPdpa:
    def test_clean_text_not_redacted(self):
        result = redact_pdpa("My mum needs home nursing")
        assert result["redacted"] is False
        assert result["flags"] == []
        assert result["text"] == "My mum needs home nursing"

    def test_nric_is_partially_masked(self):
        result = redact_pdpa("My NRIC is S1234567D")
        assert result["redacted"] is True
        assert "S1234567D" not in result["text"]
        assert any("NRIC" in f for f in result["flags"])

    def test_nric_preserves_first_and_last_char(self):
        result = redact_pdpa("NRIC: S1234567D")
        # Format: first char + **** + last char
        assert "S****D" in result["text"]

    def test_fin_number_is_redacted(self):
        result = redact_pdpa("His FIN is F9876543W")
        assert result["redacted"] is True
        assert "F9876543W" not in result["text"]

    def test_email_is_redacted(self):
        result = redact_pdpa("Contact me at jane@example.com")
        assert result["redacted"] is True
        assert "jane@example.com" not in result["text"]
        assert "****@****" in result["text"]
        assert any("email" in f.lower() for f in result["flags"])

    def test_sg_phone_is_redacted(self):
        result = redact_pdpa("Call me at 91234567")
        assert result["redacted"] is True
        assert any("phone" in f.lower() for f in result["flags"])

    def test_multiple_pii_types_all_flagged(self):
        result = redact_pdpa("S1234567D, email jane@test.com, phone 91234567")
        assert result["redacted"] is True
        assert len(result["flags"]) >= 3


# ── check_medical_advice ──────────────────────────────────────────────────────

class TestCheckMedicalAdvice:
    def test_clean_text_has_no_flags(self):
        result = check_medical_advice("My mum needs help getting dressed")
        assert result["needs_disclaimer"] is False
        assert result["disclaimer"] is None
        assert result["flags"] == []

    def test_specific_dosage_triggers_flag(self):
        result = check_medical_advice("He should take 500mg now")
        assert result["needs_disclaimer"] is True
        assert result["disclaimer"] is not None

    def test_prescribe_language_triggers_flag(self):
        result = check_medical_advice("Can you prescribe something for the pain?")
        assert result["needs_disclaimer"] is True

    def test_diagnose_language_triggers_flag(self):
        result = check_medical_advice("Can you diagnose what is wrong?")
        assert result["needs_disclaimer"] is True

    def test_stop_taking_medication_triggers_flag(self):
        result = check_medical_advice("Stop taking your warfarin now")
        assert result["needs_disclaimer"] is True

    def test_increase_dose_triggers_flag(self):
        result = check_medical_advice("Increase the dose of amlodipine")
        assert result["needs_disclaimer"] is True

    def test_disclaimer_text_mentions_healthcare_professional(self):
        result = check_medical_advice("Take 500mg now")
        assert "healthcare professional" in result["disclaimer"].lower()


# ── check_human_gate ──────────────────────────────────────────────────────────

class TestCheckHumanGate:
    def test_benign_text_does_not_trigger(self):
        result = check_human_gate("My mum needs home nursing care")
        assert result["requires_confirmation"] is False
        assert result["risky_actions"] == []
        assert result["gate_message"] is None

    def test_escalate_triggers_gate(self):
        result = check_human_gate("Please escalate this case immediately")
        assert result["requires_confirmation"] is True
        assert any("escalat" in a for a in result["risky_actions"])

    def test_submit_triggers_gate(self):
        result = check_human_gate("Submit the application for my mother")
        assert result["requires_confirmation"] is True

    def test_call_ambulance_triggers_gate(self):
        result = check_human_gate("call ambulance for the patient")
        assert result["requires_confirmation"] is True

    def test_handover_triggers_gate(self):
        result = check_human_gate("initiate handover to the coordinator")
        assert result["requires_confirmation"] is True

    def test_gate_message_non_null_when_triggered(self):
        result = check_human_gate("submit this referral please")
        assert result["gate_message"] is not None


# ── add_traceability ──────────────────────────────────────────────────────────

class TestAddTraceability:
    def test_returns_adapter_name(self):
        result = add_traceability("chat", ["openai"])
        assert result["adapter"] == "chat"

    def test_returns_sources(self):
        result = add_traceability("aic", ["eldercare_geojson"])
        assert "eldercare_geojson" in result["sources"]

    def test_traceable_is_true(self):
        result = add_traceability("", [])
        assert result["traceable"] is True

    def test_timestamp_is_string(self):
        result = add_traceability("", [])
        assert isinstance(result["timestamp"], str)
        assert "T" in result["timestamp"]  # ISO format


# ── guardian_check — full pipeline ───────────────────────────────────────────

class TestGuardianCheckPass:
    def test_benign_message_passes(self):
        result = guardian_check("My mum needs a nurse at home after her surgery")
        assert result["passed"] is True
        assert result["flag_count"] == 0

    def test_empty_string_passes(self):
        result = guardian_check("")
        assert result["passed"] is True

    def test_whitespace_passes(self):
        result = guardian_check("   ")
        assert result["passed"] is True

    def test_safe_text_equals_input_when_no_pii(self):
        text = "I need eldercare services near Ang Mo Kio"
        result = guardian_check(text)
        assert result["safe_text"] == text

    def test_original_redacted_false_when_no_pii(self):
        result = guardian_check("Can you find a nursing home nearby?")
        assert result["original_redacted"] is False

    def test_no_disclaimer_for_non_medical_text(self):
        result = guardian_check("My uncle lives alone and needs company")
        assert result["medical_disclaimer"] is None

    def test_no_confirmation_for_safe_text(self):
        result = guardian_check("Looking for eldercare support options")
        assert result["requires_confirmation"] is False


class TestGuardianCheckPii:
    def test_nric_sets_original_redacted(self):
        result = guardian_check("NRIC S1234567D here")
        assert result["original_redacted"] is True

    def test_nric_not_in_safe_text(self):
        result = guardian_check("My NRIC is S1234567D please help")
        assert "S1234567D" not in result["safe_text"]

    def test_email_not_in_safe_text(self):
        result = guardian_check("Email me at test@example.com")
        assert "test@example.com" not in result["safe_text"]

    def test_phone_not_in_safe_text(self):
        result = guardian_check("My number is 91234567")
        # Original phone digits should not appear verbatim
        assert "91234567" not in result["safe_text"]

    def test_pii_adds_flags(self):
        result = guardian_check("NRIC S9876543B")
        assert result["flag_count"] > 0
        assert len(result["flags"]) > 0

    def test_pii_message_still_has_passed_false(self):
        result = guardian_check("S1234567D")
        assert result["passed"] is False


class TestGuardianCheckMedical:
    def test_dosage_adds_disclaimer(self):
        result = guardian_check("Take 500mg of paracetamol twice a day")
        assert result["medical_disclaimer"] is not None

    def test_medical_advice_adds_flags(self):
        result = guardian_check("Increase the dose immediately")
        assert result["flag_count"] > 0

    def test_medical_advice_sets_passed_false(self):
        result = guardian_check("You should prescribe him something stronger")
        assert result["passed"] is False

    def test_safe_text_unchanged_for_medical_language(self):
        # Medical advice is not redacted from safe_text — only flagged
        text = "Stop taking your warfarin now"
        result = guardian_check(text)
        assert result["safe_text"] == text


class TestGuardianCheckHumanGate:
    def test_escalate_requires_confirmation(self):
        result = guardian_check("Please escalate this to the coordinator")
        assert result["requires_confirmation"] is True

    def test_book_requires_confirmation(self):
        result = guardian_check("Book an appointment at the clinic")
        assert result["requires_confirmation"] is True

    def test_risky_actions_populated(self):
        result = guardian_check("Please escalate this case")
        assert len(result["risky_actions"]) > 0

    def test_human_gate_sets_passed_false(self):
        result = guardian_check("Submit the referral form now")
        assert result["passed"] is False


class TestGuardianCheckStructure:
    REQUIRED_KEYS = {
        "safe_text", "original_redacted", "medical_disclaimer",
        "requires_confirmation", "risky_actions", "traceability",
        "flags", "flag_count", "passed",
    }

    def _check(self, text: str):
        result = guardian_check(text)
        for key in self.REQUIRED_KEYS:
            assert key in result, f"Missing key '{key}'"
        return result

    def test_benign_has_all_keys(self):
        self._check("My mum needs a carer")

    def test_pii_has_all_keys(self):
        self._check("S1234567D")

    def test_medical_has_all_keys(self):
        self._check("Take 500mg now")

    def test_gate_has_all_keys(self):
        self._check("Please escalate this")

    def test_passed_is_bool(self):
        for text in ["hello", "S1234567D", "500mg now", "escalate"]:
            assert isinstance(guardian_check(text)["passed"], bool)

    def test_flag_count_matches_flags_length(self):
        for text in ["hello", "S1234567D", "prescribe now", "escalate"]:
            result = guardian_check(text)
            assert result["flag_count"] == len(result["flags"])

    def test_traceability_has_timestamp(self):
        result = guardian_check("hello")
        assert "timestamp" in result["traceability"]

    def test_adapter_name_passed_through(self):
        result = guardian_check("hello", adapter_name="aic")
        assert result["traceability"]["adapter"] == "aic"

    def test_data_sources_passed_through(self):
        result = guardian_check("hello", data_sources=["openai"])
        assert "openai" in result["traceability"]["sources"]
