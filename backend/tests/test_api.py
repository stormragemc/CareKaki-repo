"""
Integration tests for the FastAPI application (main.py).

Uses FastAPI's TestClient so no live server is needed.
The google.generativeai SDK is stubbed in conftest.py; Telegram HTTP calls are
patched per-test so the suite runs fully offline.
"""

import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


# ── helpers ───────────────────────────────────────────────────────────────────

def _gemini_response(text: str) -> MagicMock:
    """Minimal mock that looks like a Gemini GenerateContentResponse."""
    mock = MagicMock()
    mock.text = text
    return mock


# ── health check ──────────────────────────────────────────────────────────────

class TestHealthCheck:
    def test_returns_200(self):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_returns_running_status(self):
        assert client.get("/").json()["status"] == "Backend running"


# ── log endpoints ─────────────────────────────────────────────────────────────

class TestLogEndpoints:
    def test_telegram_log_returns_list(self):
        resp = client.get("/telegram/log")
        assert resp.status_code == 200
        assert isinstance(resp.json()["log"], list)

    def test_iccp_log_returns_list(self):
        resp = client.get("/iccp/log")
        assert resp.status_code == 200
        assert isinstance(resp.json()["log"], list)

    def test_medication_log_returns_list(self):
        resp = client.get("/medication/log")
        assert resp.status_code == 200
        assert isinstance(resp.json()["log"], list)


# ── /chat ─────────────────────────────────────────────────────────────────────

class TestChatEndpoint:
    def test_returns_content_and_profile_update(self):
        session = MagicMock()
        session.send_message.return_value = _gemini_response("I can help with that.")
        main.chat_model.start_chat.return_value = session
        main.extraction_model.generate_content.return_value = _gemini_response(
            json.dumps({"name": "Mdm Tan", "age": 78})
        )

        resp = client.post("/chat", json={
            "messages": [{"role": "user", "content": "My mum had a fall"}]
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "content" in body
        assert "profileUpdate" in body

    def test_profile_update_is_dict(self):
        session = MagicMock()
        session.send_message.return_value = _gemini_response("Let me check.")
        main.chat_model.start_chat.return_value = session
        main.extraction_model.generate_content.return_value = _gemini_response(
            json.dumps({"age": 82})
        )

        resp = client.post("/chat", json={
            "messages": [{"role": "user", "content": "He is 82 years old"}]
        })
        assert isinstance(resp.json()["profileUpdate"], dict)

    def test_malformed_extraction_returns_empty_dict(self):
        session = MagicMock()
        session.send_message.return_value = _gemini_response("Okay.")
        main.chat_model.start_chat.return_value = session
        main.extraction_model.generate_content.return_value = _gemini_response("not-json{{")

        resp = client.post("/chat", json={
            "messages": [{"role": "user", "content": "hello"}]
        })
        assert resp.status_code == 200
        assert resp.json()["profileUpdate"] == {}

    def test_missing_messages_returns_422(self):
        assert client.post("/chat", json={}).status_code == 422


# ── /pathway ──────────────────────────────────────────────────────────────────

class TestPathwayEndpoint:
    def test_returns_columns_list(self):
        columns = [
            {"id": "week1", "timeframe": "THIS WEEK", "title": "Immediate Support",
             "colorScheme": "orange", "items": ["Call AIC", "Check meds", "Visit GP"],
             "whyThisForYou": "Recent fall requires immediate attention."},
        ]
        main.chat_model.generate_content.return_value = _gemini_response(json.dumps(columns))

        resp = client.post("/pathway", json={"profile": {
            "name": "Mdm Tan", "age": 78, "living": "Alone",
            "mobility": "Walker", "conditions": "Hypertension",
            "caregiver": "Daughter", "financialTier": "Full subsidy",
            "recentEvent": "Fell at home",
        }})
        assert resp.status_code == 200
        assert isinstance(resp.json()["columns"], list)

    def test_malformed_json_returns_empty_columns(self):
        main.chat_model.generate_content.return_value = _gemini_response("not json")

        resp = client.post("/pathway", json={"profile": {}})
        assert resp.status_code == 200
        assert resp.json()["columns"] == []

    def test_missing_profile_returns_422(self):
        assert client.post("/pathway", json={}).status_code == 422


# ── /carekaki/emergency-alert ─────────────────────────────────────────────────

class TestEmergencyAlert:
    def test_error_when_no_caregiver_registered(self):
        main.caregiver_chat_id = None
        resp = client.post("/carekaki/emergency-alert", json={"message": "Mrs Tan fell!"})
        body = resp.json()
        assert body["ok"] is False
        assert "error" in body

    @patch("main.send_telegram_message")
    def test_ok_when_caregiver_registered(self, mock_send):
        main.caregiver_chat_id = 123456
        resp = client.post("/carekaki/emergency-alert", json={"message": "Mrs Tan fell!"})
        assert resp.json()["ok"] is True
        mock_send.assert_called_once()

    def test_missing_message_returns_422(self):
        assert client.post("/carekaki/emergency-alert", json={}).status_code == 422


# ── /integrations/aic/recommend ──────────────────────────────────────────────

class TestAicRecommend:
    def test_returns_recommended_services(self):
        resp = client.post("/integrations/aic/recommend", json={"care_need": "senior fell at home"})
        assert resp.status_code == 200
        assert "recommended_services" in resp.json()

    def test_limit_respected(self):
        resp = client.post("/integrations/aic/recommend", json={"care_need": "elderly support", "limit": 2})
        assert len(resp.json()["recommended_services"]) <= 2

    def test_with_location_gives_distance(self):
        resp = client.post("/integrations/aic/recommend", json={
            "care_need": "fell at home",
            "latitude": 1.3691,
            "longitude": 103.8454,
            "limit": 1,
        })
        services = resp.json()["recommended_services"]
        if services:
            assert services[0]["distance_km"] is not None

    def test_missing_care_need_returns_422(self):
        assert client.post("/integrations/aic/recommend", json={}).status_code == 422


# ── /integrations/nursing/recommend ──────────────────────────────────────────

class TestNursingRecommend:
    def test_returns_recommended_providers(self):
        resp = client.post("/integrations/nursing/recommend", json={"care_need": "wound care after surgery"})
        assert resp.status_code == 200
        assert "recommended_providers" in resp.json()

    def test_limit_respected(self):
        resp = client.post("/integrations/nursing/recommend", json={"care_need": "wound care", "limit": 2})
        assert len(resp.json()["recommended_providers"]) <= 2

    def test_each_provider_has_slots(self):
        resp = client.post("/integrations/nursing/recommend", json={"care_need": "wound care", "limit": 1})
        providers = resp.json()["recommended_providers"]
        if providers:
            assert "available_slots" in providers[0]


# ── /integrations/medication-review/request ──────────────────────────────────

class TestMedicationReview:
    def test_returns_review_packet(self):
        resp = client.post("/integrations/medication-review/request", json={
            "senior_name": "Mr Lim",
            "age": 82,
            "medications": ["amlodipine", "metformin"],
            "symptom": "dizzy after taking medication",
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "risk_level" in body
        assert "review_flags" in body

    def test_extracts_meds_from_raw_message(self):
        resp = client.post("/integrations/medication-review/request", json={
            "senior_name": "Uncle Raj",
            "age": 85,
            "raw_message": "He takes warfarin and furosemide every day",
            "symptom": "collapsed",
        })
        body = resp.json()
        assert "warfarin" in body["medications"] or "furosemide" in body["medications"]

    def test_high_symptom_gives_high_risk(self):
        resp = client.post("/integrations/medication-review/request", json={
            "senior_name": "Test",
            "age": 80,
            "medications": ["warfarin"],
            "symptom": "collapsed and unresponsive",
        })
        assert resp.json()["risk_level"] == "high"

    def test_missing_senior_name_returns_422(self):
        assert client.post("/integrations/medication-review/request", json={"age": 80}).status_code == 422

    def test_missing_age_returns_422(self):
        assert client.post("/integrations/medication-review/request", json={"senior_name": "Test"}).status_code == 422


# ── /integrations/iccp/handover ──────────────────────────────────────────────

class TestIccpHandover:
    def test_error_when_no_coordinator(self):
        main.coordinator_chat_id = None
        resp = client.post("/integrations/iccp/handover", json={
            "patient_name": "Mdm Tan", "age": 78, "issue": "Post-fall risk"
        })
        body = resp.json()
        assert body["ok"] is False
        assert "error" in body

    @patch("main.send_iccp_message")
    def test_returns_case_id_with_coordinator(self, _mock_send):
        main.coordinator_chat_id = 789012
        resp = client.post("/integrations/iccp/handover", json={
            "patient_name": "Mdm Tan", "age": 78, "issue": "Post-fall risk"
        })
        body = resp.json()
        assert body["ok"] is True
        assert body["case_id"].startswith("CK-")

    def test_missing_patient_name_returns_422(self):
        assert client.post("/integrations/iccp/handover", json={"age": 78, "issue": "test"}).status_code == 422


# ── /guardian/check ───────────────────────────────────────────────────────────

class TestGuardianEndpoint:
    def test_benign_message_is_allowed(self):
        resp = client.post("/guardian/check", json={"text": "My mum needs a nurse at home"})
        assert resp.status_code == 200
        assert resp.json()["decision"] == "allow"

    def test_medical_advice_is_blocked(self):
        resp = client.post("/guardian/check", json={"text": "Should I increase her metformin dosage?"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["decision"] == "block"
        assert body["category"] == "medical_advice"

    def test_nric_is_blocked_and_redacted(self):
        resp = client.post("/guardian/check", json={"text": "My NRIC is S1234567D please help"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["decision"] == "block"
        assert body["category"] == "pii"
        assert "S1234567D" not in body["redacted"]

    def test_missing_text_returns_422(self):
        assert client.post("/guardian/check", json={}).status_code == 422


# ── /telegram/webhook ────────────────────────────────────────────────────────

class TestTelegramWebhook:
    @patch("main.send_telegram_message")
    def test_start_registers_caregiver(self, _mock_send):
        main.caregiver_chat_id = None
        client.post("/telegram/webhook", json={
            "message": {"text": "/start", "chat": {"id": 555}, "from": {"first_name": "Mei"}}
        })
        assert main.caregiver_chat_id == 555

    @patch("main.send_telegram_message")
    def test_known_button_replies_correctly(self, mock_send):
        main.caregiver_chat_id = 555
        client.post("/telegram/webhook", json={
            "callback_query": {
                "data": "I'm going now",
                "message": {"chat": {"id": 555}},
                "from": {"first_name": "Mei"},
            }
        })
        sent_text = mock_send.call_args[0][1]
        assert "responder" in sent_text.lower()

    @patch("main.send_telegram_message")
    def test_escalate_button_mentions_iccp(self, mock_send):
        client.post("/telegram/webhook", json={
            "callback_query": {
                "data": "Escalate",
                "message": {"chat": {"id": 555}},
                "from": {"first_name": "Mei"},
            }
        })
        sent_text = mock_send.call_args[0][1]
        assert "ICCP" in sent_text or "coordinator" in sent_text.lower()

    @patch("main.send_telegram_message")
    def test_free_text_triggers_classification(self, _mock_send):
        main.extraction_model.generate_content.return_value = _gemini_response(json.dumps({
            "intent": "caregiver_responding",
            "status": "on_the_way",
            "eta_minutes": 15,
            "extra_request": None,
            "urgency": "medium",
        }))
        resp = client.post("/telegram/webhook", json={
            "message": {
                "text": "I'm coming in 15 minutes",
                "chat": {"id": 555},
                "from": {"first_name": "Mei"},
            }
        })
        assert resp.json()["ok"] is True
        assert "classification" in resp.json()


# ── /iccp/webhook ────────────────────────────────────────────────────────────

class TestIccpWebhook:
    @patch("main.send_iccp_message")
    def test_coordinator_command_registers_group(self, _mock_send):
        main.coordinator_chat_id = None
        client.post("/iccp/webhook", json={
            "message": {"text": "/coordinator", "chat": {"id": 999}, "from": {"first_name": "Coor"}}
        })
        assert main.coordinator_chat_id == 999

    @patch("main.send_iccp_message")
    def test_accept_case_reply_mentions_accepted(self, mock_send):
        client.post("/iccp/webhook", json={
            "callback_query": {
                "data": "Accept Case",
                "message": {"chat": {"id": 999}},
                "from": {"first_name": "Nurse"},
            }
        })
        sent_text = mock_send.call_args[0][1]
        assert "accepted" in sent_text.lower()

    @patch("main.send_iccp_message")
    def test_escalate_button_mentions_escalation(self, mock_send):
        client.post("/iccp/webhook", json={
            "callback_query": {
                "data": "Escalate",
                "message": {"chat": {"id": 999}},
                "from": {"first_name": "Nurse"},
            }
        })
        sent_text = mock_send.call_args[0][1]
        assert "escalat" in sent_text.lower()
