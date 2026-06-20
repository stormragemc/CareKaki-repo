"""
Unit tests for services/nursing_adapter.py

Covers: HTML extraction, care-need classification, provider scoring,
slot generation, haversine distance, and the recommend_nursing_providers path.
"""

import pytest
from services.nursing_adapter import (
    extract_html_field,
    classify_need,
    score_provider,
    generate_slots,
    haversine_km,
    recommend_nursing_providers,
)


# ── extract_html_field ────────────────────────────────────────────────────────

SAMPLE_CLINIC_HTML = """
<table>
  <tr><th>HCI_NAME</th><td>Toa Payoh Family Clinic</td></tr>
  <tr><th>POSTAL_CD</th><td>310150</td></tr>
  <tr><th>CLINIC_PROGRAMME_CODE</th><td>CDMP, ISP, CHAS</td></tr>
</table>
"""

class TestExtractHtmlField:
    def test_extracts_clinic_name(self):
        assert extract_html_field(SAMPLE_CLINIC_HTML, "HCI_NAME") == "Toa Payoh Family Clinic"

    def test_extracts_postal_code(self):
        assert extract_html_field(SAMPLE_CLINIC_HTML, "POSTAL_CD") == "310150"

    def test_extracts_programme_codes(self):
        result = extract_html_field(SAMPLE_CLINIC_HTML, "CLINIC_PROGRAMME_CODE")
        assert "CDMP" in result

    def test_returns_empty_for_missing_field(self):
        assert extract_html_field(SAMPLE_CLINIC_HTML, "NONEXISTENT") == ""


# ── classify_need ─────────────────────────────────────────────────────────────

class TestClassifyNeed:
    def test_wound_triggers_nursing_keywords(self):
        keywords = classify_need("mother needs wound dressing at home")
        assert any(kw in ["clinic", "medical", "nursing", "surgery"] for kw in keywords)

    def test_fall_triggers_clinical_keywords(self):
        keywords = classify_need("father fell down the stairs and is in pain")
        assert len(keywords) > 0

    def test_chronic_diabetes_triggers_cdmp(self):
        keywords = classify_need("managing chronic diabetes and hypertension")
        assert "CDMP" in keywords

    def test_fever_triggers_clinic_keywords(self):
        keywords = classify_need("running a fever and coughing badly")
        assert "clinic" in keywords

    def test_elderly_triggers_chas_keywords(self):
        keywords = classify_need("elderly grandmother needs regular check-up")
        assert any(kw in ["CHAS", "clinic", "family"] for kw in keywords)

    def test_unknown_care_need_returns_defaults(self):
        keywords = classify_need("needs some support")
        assert "clinic" in keywords

    def test_deduplicates_keywords(self):
        keywords = classify_need("fell with wound injury and pain")
        assert len(keywords) == len(set(keywords))


# ── score_provider ────────────────────────────────────────────────────────────

class TestScoreProvider:
    def _make_provider(self, name="", programmes=None, address=""):
        return {
            "name": name,
            "programmes": programmes or [],
            "address": address,
        }

    def test_matching_keyword_in_name_adds_score(self):
        provider = self._make_provider(name="Bedok Family Clinic Medical")
        score = score_provider(provider, ["clinic", "family", "medical"])
        assert score > 0

    def test_cdmp_programme_adds_bonus(self):
        with_cdmp = self._make_provider(name="Test Clinic", programmes=["CDMP"])
        without_cdmp = self._make_provider(name="Test Clinic", programmes=[])
        assert score_provider(with_cdmp, []) > score_provider(without_cdmp, [])

    def test_isp_programme_adds_bonus(self):
        with_isp = self._make_provider(name="Test Clinic", programmes=["ISP"])
        without_isp = self._make_provider(name="Test Clinic", programmes=[])
        assert score_provider(with_isp, []) > score_provider(without_isp, [])

    def test_no_keyword_match_returns_low_score(self):
        provider = self._make_provider(name="Unrelated Health Centre")
        assert score_provider(provider, ["wound", "nursing"]) == 0

    def test_multiple_keywords_accumulate(self):
        provider = self._make_provider(name="Family Medical Clinic CHAS Centre", programmes=["CDMP"])
        score = score_provider(provider, ["clinic", "family", "medical", "CHAS"])
        assert score >= 40  # 4 × 10 + 5 CDMP


# ── generate_slots ────────────────────────────────────────────────────────────

class TestGenerateSlots:
    def test_generates_correct_number_of_slots(self):
        slots = generate_slots("Test Clinic", num_slots=3)
        assert len(slots) == 3

    def test_generates_custom_number_of_slots(self):
        slots = generate_slots("Test Clinic", num_slots=5)
        assert len(slots) == 5

    def test_each_slot_has_required_fields(self):
        slots = generate_slots("Test Clinic")
        for slot in slots:
            assert "date" in slot
            assert "time" in slot
            assert "type" in slot

    def test_slot_type_is_valid(self):
        valid_types = {"Home Visit", "Clinic Visit", "Teleconsult"}
        slots = generate_slots("Test Clinic", num_slots=10)
        for slot in slots:
            assert slot["type"] in valid_types

    def test_same_provider_same_slots(self):
        slots_a = generate_slots("Toa Payoh Clinic")
        slots_b = generate_slots("Toa Payoh Clinic")
        assert slots_a == slots_b

    def test_different_providers_may_differ(self):
        slots_a = generate_slots("Ang Mo Kio Clinic")
        slots_b = generate_slots("Bedok North Clinic")
        # Different seed should produce different results (very likely)
        # We only assert structure here; slot equality would be coincidental
        assert len(slots_a) == len(slots_b)


# ── haversine_km ──────────────────────────────────────────────────────────────

class TestHaversineKm:
    def test_same_point_is_zero(self):
        assert haversine_km(1.3521, 103.8198, 1.3521, 103.8198) == pytest.approx(0.0, abs=1e-6)

    def test_jurong_to_bedok_approx_20km(self):
        # Jurong East ~(1.3480, 103.7300) to Bedok ~(1.3290, 103.9300)
        dist = haversine_km(1.3480, 103.7300, 1.3290, 103.9300)
        assert 17 < dist < 24

    def test_is_symmetric(self):
        d1 = haversine_km(1.3480, 103.7300, 1.3290, 103.9300)
        d2 = haversine_km(1.3290, 103.9300, 1.3480, 103.7300)
        assert d1 == pytest.approx(d2, rel=1e-6)

    def test_returns_positive(self):
        assert haversine_km(1.3, 103.8, 1.4, 103.9) > 0


# ── recommend_nursing_providers ───────────────────────────────────────────────

class TestRecommendNursingProviders:
    def test_response_has_required_keys(self):
        result = recommend_nursing_providers("wound care needed at home")
        for key in ["adapter", "recommended_providers", "keywords_used", "care_need"]:
            assert key in result

    def test_returns_at_most_limit_providers(self):
        result = recommend_nursing_providers("wound care", limit=2)
        assert len(result["recommended_providers"]) <= 2

    def test_each_provider_has_expected_fields(self):
        result = recommend_nursing_providers("wound care")
        for prov in result["recommended_providers"]:
            assert "name" in prov
            assert "available_slots" in prov
            assert "total_score" in prov
            assert "distance_km" in prov

    def test_with_location_populates_distance(self):
        result = recommend_nursing_providers(
            "post-surgery wound care",
            user_latitude=1.3480,
            user_longitude=103.7300,
        )
        for prov in result["recommended_providers"]:
            assert prov["distance_km"] is not None
            assert isinstance(prov["distance_km"], float)

    def test_without_location_distance_is_none(self):
        result = recommend_nursing_providers("wound care")
        for prov in result["recommended_providers"]:
            assert prov["distance_km"] is None

    def test_results_sorted_descending_by_total_score(self):
        result = recommend_nursing_providers("wound care")
        scores = [p["total_score"] for p in result["recommended_providers"]]
        assert scores == sorted(scores, reverse=True)

    def test_each_provider_has_slots(self):
        result = recommend_nursing_providers("wound care", limit=1)
        assert len(result["recommended_providers"][0]["available_slots"]) > 0

    def test_booking_status_is_tentative(self):
        result = recommend_nursing_providers("elderly needs check-up", limit=1)
        assert result["recommended_providers"][0]["booking_status"] == "tentative"
