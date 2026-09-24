import json
from unittest.mock import MagicMock

import httpx
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

import ai


@pytest.mark.parametrize("message", ["", "   ", "a" * 2001, None])
def test_invalid_message_does_not_call_model(monkeypatch, message):
    completion = MagicMock()
    monkeypatch.setattr(ai, "request_completion", completion)
    with pytest.raises(ValidationError):
        ai.ChatRequest(message=message)
    completion.assert_not_called()


def test_chat_calls_local_ollama(monkeypatch):
    requests = []
    transport = httpx.MockTransport(
        lambda request: (
            requests.append(request)
            or httpx.Response(200, json={"message": {"content": "Bonjour !"}})
        )
    )
    local_client = httpx.Client(transport=transport)
    monkeypatch.setattr(ai.httpx, "Client", MagicMock(return_value=local_client))
    response = ai.chat(ai.ChatRequest(message=" Bonjour "))
    assert response == {"reply": "Bonjour !"}
    assert str(requests[0].url) == "http://127.0.0.1:11435/api/chat"
    assert json.loads(requests[0].content) == {
        "model": "qwen2.5:0.5b",
        "messages": [{"role": "user", "content": "Bonjour"}],
        "stream": False,
        "options": {"num_ctx": 4096, "num_predict": 256},
    }


@pytest.mark.parametrize("upstream, expected", [(404, 503), (500, 502)])
def test_ollama_errors_hide_details(monkeypatch, upstream, expected):
    transport = httpx.MockTransport(
        lambda request: httpx.Response(upstream, json={"error": "private-details"})
    )
    local_client = httpx.Client(transport=transport)
    monkeypatch.setattr(ai.httpx, "Client", MagicMock(return_value=local_client))
    with pytest.raises(HTTPException) as raised:
        ai.chat(ai.ChatRequest(message="Bonjour"))
    assert raised.value.status_code == expected
    assert "private-details" not in raised.value.detail


@pytest.mark.parametrize(
    "error, expected",
    [(httpx.ConnectError("offline"), 503), (httpx.ReadTimeout("slow"), 504)],
)
def test_ollama_connection_errors(monkeypatch, error, expected):
    monkeypatch.setattr(ai, "request_completion", MagicMock(side_effect=error))
    with pytest.raises(HTTPException) as raised:
        ai.chat(ai.ChatRequest(message="Bonjour"))
    assert raised.value.status_code == expected


def match_payload():
    profile = {
        "goals": ["restauration"],
        "skills": ["cuisine"],
        "languages": ["français"],
        "availability": "matin",
        "consent": True,
    }
    return {
        "event": {
            "title": "Atelier cuisine",
            "description": "Préparer un repas",
            "opportunity": "Découvrir un métier",
        },
        "residents": [
            {"id": "fatou", "first_name": "Fatou", **profile},
            {"id": "lea", "first_name": "Léa", **profile, "consent": False},
        ],
    }


def test_match_uses_only_consenting_profiles(monkeypatch):
    requests = []
    result = {
        "matches": [
            {
                "resident_id": "fatou",
                "rationale": "Objectif cohérent",
                "benefit": "Découverte",
                "vigilance": "Vérifier l'horaire",
            }
        ]
    }
    transport = httpx.MockTransport(
        lambda request: (
            requests.append(request)
            or httpx.Response(200, json={"message": {"content": json.dumps(result)}})
        )
    )
    monkeypatch.setattr(
        ai.httpx, "Client", MagicMock(return_value=httpx.Client(transport=transport))
    )
    response = ai.request_matching(ai.MatchRequest.model_validate(match_payload()))
    body = json.loads(requests[0].content)
    assert response.matches[0].resident_id == "fatou"
    assert "Fatou" in body["messages"][0]["content"]
    assert "Léa" not in body["messages"][0]["content"]
    assert body["format"]["properties"]["matches"]


def test_match_requires_active_consent(monkeypatch):
    payload = match_payload()
    for profile in payload["residents"]:
        profile["consent"] = False
    local_client = MagicMock()
    monkeypatch.setattr(ai.httpx, "Client", local_client)
    with pytest.raises(HTTPException) as raised:
        ai.request_matching(ai.MatchRequest.model_validate(payload))
    assert raised.value.status_code == 422
    local_client.assert_not_called()
