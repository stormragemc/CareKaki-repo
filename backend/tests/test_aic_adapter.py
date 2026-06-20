"""
Unit tests for services/aic_adapter.py

Covers: HTML field extraction, care-need classification, service scoring,
haversine distance, and the recommend_aic_services integration path.
"""

import pytest
from services.aic_adapter import (
    extract_html_field,
    classify_need,
    score_service,
    haversine_km,
    recommend_aic_services,
)


# ── extract_html_field ────────────────────────────────────────────────────────

SAMPLE_HTML = """
<table>
  <tr><th>NAME</th><td>Ang Mo Kio Senior Activity Centre</td></tr>
  <tr><th>ADDRESSPOSTALCODE</th><td>560208</td></tr>
  <tr><th>DESCRIPTION</th><td>Active ageing &amp; befriending services</td></tr>
</table>
"""

class TestExtractHtmlField:
    def test_extracts_existing_field(self):
        assert extract_html_field(SAMPLE_HTML, "NAME") == "Ang Mo Kio Senior Activity Centre"

    def test_extracts_postal_code(self):
        assert extract_html_field(SAMPLE_HTML, "ADDRESSPOSTALCODE") == "560208"

    def test_decodes_html_entities(self):
        result = extract_html_field(SAMPLE_HTML, "DESCRIPTION")
        assert "&amp;" not in result
        assert "&" in result

    def test_returns_empty_for_missing_field(self):
        assert extract_html_field(SAMPLE_HTML, "NONEXISTENT") == ""

    def test_returns_empty_for_empty_html(self):
        assert extract_html_field("", "NAME") == ""


# ── classify_need ─────────────────────────────────────────────────────────────

class TestClassifyNeed:
    def test_fall_triggers_mobility_keywords(self):
        keywords = classify_need("My mother had a fall and can't walk well")
        assert any("senior" in kw.lower() or "active" in kw.lower() or "SAC" in kw for kw in keywords)

    def test_fracture_triggers_mobility_keywords(self):
        keywords = classify_need("Discharged after fracture, needs support")
        assert len(keywords) > 0

    def test_lonely_triggers_social_keywords(self):
        keywords = classify_need("Father is very lonely and isolated at home")
        assert any("befriending" in kw.lower() or "community" in kw.lower() for kw in keywords)

    def test_dementia_triggers_dementia_keywords(self):
        keywords = classify_need("Mother has dementia and keeps wandering")
        assert any("dementia" in kw.lower() or "senior care" in kw.lower() for kw in keywords)

    def test_caregiver_burnout_triggers_respite_keywords(self):
        keywords = classify_need("I'm suffering caregiver burnout and need respite")
        assert any("respite" in kw.lower() or "caregiver" in kw.lower() for kw in keywords)

    def test_unknown_need_returns_default_keywords(self):
        keywords = classify_need("needs some general help")
        assert len(keywords) > 0
        assert any("senior activity centre" in kw.lower() or "active ageing" in kw.lower() for kw in keywords)

    def test_deduplicates_keywords(self):
        keywords = classify_need("fall and also lonely")
        assert len(keywords) == len(set(keywords))

    def test_case_insensitive_matching(self):
        lower = classify_need("FALL at home")
        upper = classify_need("fall at home")
        assert lower == upper


# ── score_service ─────────────────────────────────────────────────────────────

class TestScoreService:
    def _make_service(self, name="", description="", address=""):
        return {"name": name, "description": description, "address": address}

    def test_matching_keyword_adds_score(self):
        service = self._make_service(name="Senior Activity Centre Toa Payoh")
        score = score_service(service, ["senior activity centre"])
        assert score > 0

    def test_no_matching_keywords_returns_base_score(self):
        service = self._make_service(name="Random Unrelated Centre")
        score = score_service(service, ["dementia", "befriending"])
        assert score == 0

    def test_senior_in_name_adds_bonus(self):
        service_with = self._make_service(name="Senior Care Centre")
        service_without = self._make_service(name="Generic Care Centre")
        keywords: list[str] = []
        assert score_service(service_with, keywords) > score_service(service_without, keywords)

    def test_sac_abbreviation_adds_bonus(self):
        service = self._make_service(name="Toa Payoh SAC")
        assert score_service(service, []) > 0

    def test_multiple_matching_keywords_accumulate(self):
        service = self._make_service(
            name="Senior Activity Centre",
            description="Active ageing befriending community",
        )
        keywords = ["senior activity centre", "active ageing", "befriending"]
        score = score_service(service, keywords)
        assert score >= 30  # 3 keywords × 10 each


# ── haversine_km ──────────────────────────────────────────────────────────────

class TestHaversineKm:
    def test_same_point_returns_zero(self):
        assert haversine_km(1.3521, 103.8198, 1.3521, 103.8198) == pytest.approx(0.0, abs=1e-6)

    def test_known_singapore_distance(self):
        # Approximate distance from Ang Mo Kio to Bedok (~11 km)
        dist = haversine_km(1.3691, 103.8454, 1.3290, 103.9300)
        assert 9 < dist < 13

    def test_returns_positive_value(self):
        dist = haversine_km(1.3, 103.8, 1.4, 103.9)
        assert dist > 0

    def test_is_symmetric(self):
        d1 = haversine_km(1.3691, 103.8454, 1.3290, 103.9300)
        d2 = haversine_km(1.3290, 103.9300, 1.3691, 103.8454)
        assert d1 == pytest.approx(d2, rel=1e-6)


# ── recommend_aic_services ────────────────────────────────────────────────────

class TestRecommendAicServices:
    def test_response_has_required_keys(self):
        result = recommend_aic_services("senior fell at home")
        assert "adapter" in result
        assert "recommended_services" in result
        assert "keywords_used" in result
        assert "care_need" in result

    def test_returns_at_most_limit_services(self):
        result = recommend_aic_services("fall", limit=2)
        assert len(result["recommended_services"]) <= 2

    def test_default_limit_is_three(self):
        result = recommend_aic_services("fall")
        assert len(result["recommended_services"]) <= 3

    def test_each_service_has_expected_fields(self):
        result = recommend_aic_services("senior fell")
        for svc in result["recommended_services"]:
            assert "name" in svc
            assert "total_score" in svc
            assert "address" in svc

    def test_with_location_adds_distance_km(self):
        result = recommend_aic_services(
            "fell at home",
            user_latitude=1.3691,
            user_longitude=103.8454,
        )
        for svc in result["recommended_services"]:
            assert svc["distance_km"] is not None

    def test_without_location_distance_is_none(self):
        result = recommend_aic_services("fell at home")
        for svc in result["recommended_services"]:
            assert svc["distance_km"] is None

    def test_results_sorted_by_total_score_descending(self):
        result = recommend_aic_services("senior fell")
        scores = [s["total_score"] for s in result["recommended_services"]]
        assert scores == sorted(scores, reverse=True)

    def test_keywords_reflected_in_response(self):
        result = recommend_aic_services("fell at home")
        assert len(result["keywords_used"]) > 0
