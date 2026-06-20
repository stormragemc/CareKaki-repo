"""
Unit tests for services/medication_adapter.py

Covers: medication name extraction, risk classification, packet building,
Telegram formatting, and the openFDA helper utilities.
Tests that hit the external openFDA API or the local HSA CSV are limited to
structural assertions so they work offline too.
"""

import pytest
from unittest.mock import patch, MagicMock
from services.medication_adapter import (
    extract_medications_from_text,
    classify_medication_risk,
    build_medication_review_packet,
    format_packet_for_telegram,
    _truncate,
)


# ── _truncate ─────────────────────────────────────────────────────────────────

class TestTruncate:
    def test_short_text_unchanged(self):
        text = "Amlodipine may cause dizziness."
        assert _truncate(text, max_len=300) == text

    def test_long_text_is_truncated(self):
        text = " ".join(["word"] * 200)
        result = _truncate(text, max_len=50)
        assert len(result) <= 55  # some leeway for word boundary + ellipsis
        assert result.endswith("…")

    def test_empty_string_returns_empty(self):
        assert _truncate("", max_len=100) == ""

    def test_normalises_whitespace(self):
        text = "too   many    spaces   here"
        result = _truncate(text, max_len=300)
        assert "  " not in result


# ── extract_medications_from_text ─────────────────────────────────────────────

class TestExtractMedicationsFromText:
    def test_finds_known_medication(self):
        meds = extract_medications_from_text("He takes amlodipine daily for blood pressure")
        assert "amlodipine" in meds

    def test_finds_multiple_medications(self):
        meds = extract_medications_from_text("On amlodipine and metformin and warfarin")
        assert "amlodipine" in meds
        assert "metformin" in meds
        assert "warfarin" in meds

    def test_case_insensitive(self):
        meds = extract_medications_from_text("Takes AMLODIPINE and METFORMIN")
        assert "amlodipine" in meds
        assert "metformin" in meds

    def test_no_medications_returns_empty(self):
        meds = extract_medications_from_text("Patient feels unwell and dizzy")
        assert meds == []

    def test_deduplicates_medications(self):
        meds = extract_medications_from_text("amlodipine amlodipine amlodipine")
        assert meds.count("amlodipine") == 1


# ── classify_medication_risk ──────────────────────────────────────────────────

class TestClassifyMedicationRisk:
    def _classify(self, symptom="", age=70, context="", matched=None, openfda=None):
        return classify_medication_risk(
            symptom=symptom,
            age=age,
            context=context,
            matched_products=matched or {},
            openfda_infos=openfda or {},
        )

    def test_high_symptom_gives_high_risk(self):
        result = self._classify(symptom="patient collapsed and is unresponsive")
        assert result["risk_level"] == "high"

    def test_chest_pain_gives_high_risk(self):
        result = self._classify(symptom="severe chest pain and shortness of breath")
        assert result["risk_level"] == "high"

    def test_dizziness_gives_medium_risk(self):
        result = self._classify(symptom="feels very dizzy and giddy")
        assert result["risk_level"] == "medium"

    def test_fall_symptom_gives_medium_risk(self):
        result = self._classify(symptom="almost fell after taking pills")
        assert result["risk_level"] == "medium"

    def test_no_concerning_symptom_gives_low_risk(self):
        result = self._classify(symptom="slightly tired after meal")
        assert result["risk_level"] == "low"

    def test_elderly_patient_adds_age_flag(self):
        result = self._classify(age=75)
        assert any("75" in f for f in result["review_flags"])

    def test_young_patient_no_age_flag(self):
        result = self._classify(age=40)
        assert not any("aged" in f.lower() for f in result["review_flags"])

    def test_no_hsa_match_adds_flag(self):
        result = self._classify(matched={"unknowndrug": []})
        assert any("No HSA-registered product" in f for f in result["review_flags"])

    def test_prescription_only_drug_adds_flag(self):
        mock_product = [{"forensic_classification": "Prescription Only Medicine", "atc_code": ""}]
        result = self._classify(matched={"warfarin": mock_product})
        assert any("prescription only" in f.lower() for f in result["review_flags"])

    def test_openfda_boxed_warning_adds_flag(self):
        openfda = {"warfarin": {"found": True, "boxed_warning": "Bleeding risk", "warnings_summary": "", "precautions_summary": ""}}
        result = self._classify(openfda=openfda)
        assert any("Boxed warning" in f for f in result["review_flags"])

    def test_always_includes_disclaimer_flags(self):
        result = self._classify()
        text = " ".join(result["review_flags"])
        assert "pharmacist" in text.lower() or "doctor" in text.lower()

    def test_high_symptom_in_context_field(self):
        result = self._classify(symptom="", context="patient had a seizure")
        assert result["risk_level"] == "high"


# ── build_medication_review_packet ────────────────────────────────────────────

class TestBuildMedicationReviewPacket:
    def _build(self, **kwargs):
        defaults = {
            "senior_name": "Mdm Tan",
            "age": 78,
            "medications": ["amlodipine"],
            "symptom": "dizzy",
        }
        defaults.update(kwargs)
        return build_medication_review_packet(**defaults)

    def test_packet_has_required_keys(self):
        packet = self._build()
        for key in ["adapter", "status", "senior_name", "age", "medications",
                    "symptom", "hsa_matches", "openfda_info", "risk_level",
                    "review_flags", "disclaimer"]:
            assert key in packet, f"Missing key: {key}"

    def test_status_is_ready_for_review(self):
        packet = self._build()
        assert packet["status"] == "ready_for_pharmacy_review"

    def test_senior_name_preserved(self):
        packet = self._build(senior_name="Mr Lim")
        assert packet["senior_name"] == "Mr Lim"

    def test_medications_extracted_from_raw_message_when_none_provided(self):
        packet = build_medication_review_packet(
            senior_name="Uncle Raj",
            age=85,
            medications=None,
            raw_message="He takes warfarin and furosemide every morning",
        )
        assert "warfarin" in packet["medications"]
        assert "furosemide" in packet["medications"]

    def test_risk_level_is_valid_value(self):
        packet = self._build(symptom="chest pain")
        assert packet["risk_level"] in {"low", "medium", "high"}

    def test_hsa_matches_keyed_by_medication_name(self):
        packet = self._build(medications=["amlodipine"])
        assert "amlodipine" in packet["hsa_matches"]

    def test_openfda_info_keyed_by_medication_name(self):
        packet = self._build(medications=["amlodipine"])
        assert "amlodipine" in packet["openfda_info"]


# ── format_packet_for_telegram ────────────────────────────────────────────────

class TestFormatPacketForTelegram:
    def _minimal_packet(self):
        return {
            "senior_name": "Mdm Tan",
            "age": 78,
            "symptom": "dizzy",
            "context": "after medication",
            "medications": ["amlodipine"],
            "risk_level": "medium",
            "hsa_matches": {
                "amlodipine": [{
                    "product_name": "Amlodipine 5mg",
                    "forensic_classification": "Prescription Only Medicine",
                    "active_ingredients": "Amlodipine besylate",
                    "strength": "5mg",
                }]
            },
            "openfda_info": {
                "amlodipine": {
                    "found": True,
                    "warnings_summary": "May cause hypotension",
                    "precautions_summary": "",
                    "adverse_reactions_summary": "",
                    "boxed_warning": "",
                }
            },
            "review_flags": ["Confirm medication name", "Not medical advice"],
        }

    def test_output_is_string(self):
        text = format_packet_for_telegram(self._minimal_packet())
        assert isinstance(text, str)

    def test_contains_senior_name(self):
        text = format_packet_for_telegram(self._minimal_packet())
        assert "Mdm Tan" in text

    def test_contains_risk_level(self):
        text = format_packet_for_telegram(self._minimal_packet())
        assert "MEDIUM" in text

    def test_contains_medication_name(self):
        text = format_packet_for_telegram(self._minimal_packet())
        assert "amlodipine" in text.lower()

    def test_contains_hsa_section(self):
        text = format_packet_for_telegram(self._minimal_packet())
        assert "HSA" in text

    def test_contains_openfda_section(self):
        text = format_packet_for_telegram(self._minimal_packet())
        assert "openFDA" in text

    def test_contains_review_flags(self):
        text = format_packet_for_telegram(self._minimal_packet())
        assert "Confirm medication name" in text

    def test_handles_no_hsa_match(self):
        packet = self._minimal_packet()
        packet["hsa_matches"] = {"amlodipine": []}
        text = format_packet_for_telegram(packet)
        assert "No HSA match" in text

    def test_handles_openfda_not_found(self):
        packet = self._minimal_packet()
        packet["openfda_info"] = {"amlodipine": {"found": False}}
        text = format_packet_for_telegram(packet)
        assert "No openFDA label found" in text

    def test_uses_html_bold_tags(self):
        text = format_packet_for_telegram(self._minimal_packet())
        assert "<b>" in text and "</b>" in text
