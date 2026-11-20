"""MARTHE_AI=0: no model is called, guided texts are used, chatbots answer 503."""

import httpx
import pytest
from fastapi.testclient import TestClient

import ai
import main
import matching
from agents import routes as agent_routes
from employment import cv_lines, planning


@pytest.fixture
def ai_off(monkeypatch):
    for module in (ai, matching, cv_lines, planning, agent_routes):
        monkeypatch.setattr(module, "AI_ENABLED", False)

    def no_network(*args, **kwargs):
        raise AssertionError("no model call expected")

    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", no_network)


def test_chat_endpoints_are_disabled(ai_off):
    client = TestClient(main.app)
    assert client.post("/api/chat", json={"message": "Bonjour"}).status_code == 503
    response = client.post(
        "/api/agents/renseignements/chat",
        json={"messages": [{"role": "user", "content": "Bonjour"}]},
    )
    assert response.status_code == 503


def test_matching_uses_guided_texts(ai_off):
    event = {
        "title": "Atelier cuisine",
        "description": "cuisine",
        "opportunity": "cuisine",
    }
    resident = {
        "id": "r1",
        "first_name": "Awa",
        "goals": ["cuisine"],
        "skills": ["cuisine"],
        "languages": [],
        "availability": "",
        "consent": True,
    }
    response = TestClient(main.app).post(
        "/api/match", json={"event": event, "residents": [resident]}
    )
    assert response.status_code == 200
    assert all(match["source"] == "guided" for match in response.json()["matches"])
