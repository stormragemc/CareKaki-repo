"""
Unit tests for services/guardian.py — CareKaki's Responsible-AI safety layer.

The Guardian is fully deterministic and has no external dependencies, so every
test here runs offline and produces a stable result.
"""

import pytest
from services.guardian import guardian_check


# ── allow path ────────────────────────────────────────────────────────────────

class TestAllowedMessages:
    def test_benign_care_navigation_is_allowed(self):
        result = guardian_check("My mum needs a nurse at home after her surgery")
        assert result["decision"] == "allow"
        assert result["category"] == "none"

    def test_empty_string_is_allowed(self):
        result = guardian_check("")
        assert result["decision"] == "allow"

    def test_whitespace_only_is_allowed(self):
        result = guardian_check("   ")
        assert result["decision"] == "allow"

    def test_symptom_description_without_clinical_ask_is_allowed(self):
        result = guardian_check("Father feels dizzy after his morning pills")
        assert result["decision"] == "allow"

    def test_service_request_is_allowed(self):
        result = guardian_check("Can you find eldercare services near Ang Mo Kio?")
        assert result["decision"] == "allow"

    def test_caregiver_situation_is_allowed(self):
        result = guardian_check("I am caring for my 78-year-old mother who lives alone")
        assert result["decision"] == "allow"

    def test_allowed_verdict_has_empty_matched(self):
        result = guardian_check("Need help finding home nursing")
        assert result["matched"] == []

    def test_allowed_redacted_equals_input(self):
        text = "My uncle needs community support"
        result = guardian_check(text)
        assert result["redacted"] == text


# ── medical advice blocking ───────────────────────────────────────────────────

class TestMedicalAdviceBlock:
    def test_should_i_increase_dose_is_blocked(self):
        result = guardian_check("Should I increase her metformin dosage?")
        assert result["decision"] == "block"
        assert result["category"] == "medical_advice"

    def test_stop_medication_question_is_blocked(self):
        result = guardian_check("Can I stop his warfarin now?")
        assert result["decision"] == "block"
        assert result["category"] == "medical_advice"

    def test_dosage_number_is_blocked(self):
        result = guardian_check("He takes 500mg twice a day")
        assert result["decision"] == "block"
        assert result["category"] == "medical_advice"

    def test_prescribe_keyword_is_blocked(self):
        result = guardian_check("Can you prescribe something for the pain?")
        assert result["decision"] == "block"
        assert result["category"] == "medical_advice"

    def test_diagnose_keyword_is_blocked(self):
        result = guardian_check("Can you diagnose what is wrong with her?")
        assert result["decision"] == "block"
        assert result["category"] == "medical_advice"

    def test_is_it_safe_to_take_is_blocked(self):
        result = guardian_check("Is it safe to take amlodipine with food?")
        assert result["decision"] == "block"
        assert result["category"] == "medical_advice"

    def test_block_reason_routes_to_human(self):
        result = guardian_check("Should I double her insulin?")
        assert "human" in result["reason"].lower() or "coordinator" in result["reason"].lower()

    def test_matched_list_is_non_empty_for_medical_block(self):
        result = guardian_check("What dose of paracetamol should he take?")
        assert len(result["matched"]) > 0


# ── PII blocking ──────────────────────────────────────────────────────────────

class TestPiiBlock:
    def test_nric_is_blocked(self):
        result = guardian_check("My NRIC is S1234567D")
        assert result["decision"] == "block"
        assert result["category"] == "pii"

    def test_fin_number_is_blocked(self):
        result = guardian_check("His FIN is F9876543W")
        assert result["decision"] == "block"
        assert result["category"] == "pii"

    def test_nric_is_redacted_in_output(self):
        result = guardian_check("My NRIC is S1234567D please help")
        assert "S1234567D" not in result["redacted"]
        assert "[NRIC]" in result["redacted"]

    def test_email_is_blocked(self):
        result = guardian_check("Please contact me at jane@example.com")
        assert result["decision"] == "block"
        assert result["category"] == "pii"

    def test_email_is_redacted(self):
        result = guardian_check("Email me at jane@example.com")
        assert "jane@example.com" not in result["redacted"]
        assert "[EMAIL]" in result["redacted"]

    def test_sg_mobile_number_is_blocked(self):
        result = guardian_check("Call me at 91234567")
        assert result["decision"] == "block"
        assert result["category"] == "pii"

    def test_sg_mobile_redacted(self):
        result = guardian_check("My number is 91234567")
        assert "91234567" not in result["redacted"]
        assert "[PHONE]" in result["redacted"]

    def test_pii_takes_priority_over_medical_advice(self):
        # NRIC + medical question — PII is checked first
        result = guardian_check("S1234567D should I increase his dose?")
        assert result["category"] == "pii"

    def test_matched_lists_pii_type(self):
        result = guardian_check("NRIC S7654321B")
        assert "NRIC/FIN" in result["matched"]

    def test_multiple_pii_types_all_listed(self):
        result = guardian_check("Email jane@test.com or call 91234567")
        matched = result["matched"]
        assert "email" in matched
        assert "phone" in matched


# ── verdict structure ─────────────────────────────────────────────────────────

class TestVerdictStructure:
    def _check_keys(self, text: str):
        result = guardian_check(text)
        for key in ["decision", "category", "reason", "matched", "redacted"]:
            assert key in result, f"Missing key '{key}' in verdict for: {text!r}"
        return result

    def test_allow_verdict_structure(self):
        self._check_keys("My mum needs a carer")

    def test_block_medical_verdict_structure(self):
        self._check_keys("Should I stop his metformin?")

    def test_block_pii_verdict_structure(self):
        self._check_keys("S1234567D")

    def test_decision_is_valid_literal(self):
        for text in ["hi", "Should I take 500mg?", "S1234567D"]:
            assert guardian_check(text)["decision"] in {"allow", "block"}

    def test_category_is_valid_literal(self):
        valid = {"none", "medical_advice", "pii"}
        for text in ["hi", "Should I take 500mg?", "S1234567D"]:
            assert guardian_check(text)["category"] in valid

    def test_redacted_field_is_always_string(self):
        for text in ["", "hello", "S1234567D", "increase dose"]:
            assert isinstance(guardian_check(text)["redacted"], str)

    def test_matched_field_is_always_list(self):
        for text in ["", "hello", "S1234567D", "increase dose"]:
            assert isinstance(guardian_check(text)["matched"], list)
