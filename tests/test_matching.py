import json
from unittest.mock import MagicMock

import httpx
import pytest
from fastapi import HTTPException

import matching
from ranking import rank_profiles


def profile(id, goals, skills, consent=True):
    return {
        "id": id,
        "first_name": id.title(),
        "goals": goals,
        "skills": skills,
        "languages": ["français"],
        "availability": "matin",
        "consent": consent,
    }


def match_payload():
    return {
        "event": {
            "title": "Entreprendre, ensemble",
            "category": "Rencontre",
            "description": "Rencontres entre entrepreneures",
            "opportunity": "Questions pour les femmes qui ont une idée de projet",
        },
        "residents": [
            profile("camille", ["Rencontrer des entrepreneures"], ["Accueil"]),
            profile("sofia", ["Créer un portfolio"], ["Photographie amateur"]),
            profile("lea", ["Rencontrer des entrepreneures"], [], consent=False),
        ],
    }


def mock_ollama(monkeypatch, handler):
    requests = []
    transport = httpx.MockTransport(
        lambda request: requests.append(request) or handler(request)
    )
    monkeypatch.setattr(
        matching.httpx,
        "Client",
        MagicMock(return_value=httpx.Client(transport=transport)),
    )
    return requests


def test_ranking_prefers_related_profiles():
    residents = match_payload()["residents"][:2]
    ranked = rank_profiles("Atelier photo et portraits", residents)
    assert [item[0]["id"] for item in ranked] == ["sofia"]
    assert ranked[0][1] == ["Photographie amateur"]
    assert len(rank_profiles("Yoga doux", residents)) == 2


def test_match_sends_only_ranked_consenting_profiles(monkeypatch):
    result = {
        "matches": [
            {
                "resident_id": "camille",
                "rationale": "Objectif cohérent",
                "benefit": "Réseau",
                "vigilance": "Horaire",
            }
        ]
    }
    requests = mock_ollama(
        monkeypatch,
        lambda request: httpx.Response(
            200, json={"message": {"content": json.dumps(result)}}
        ),
    )
    request = matching.MatchRequest.model_validate(match_payload())
    response = matching.request_matching(request)
    prompt = json.loads(requests[0].content)["messages"][0]["content"]
    assert [(m.resident_id, m.source) for m in response.matches] == [("camille", "ai")]
    assert "Camille" in prompt
    assert "Sofia" not in prompt and "Lea" not in prompt


@pytest.mark.parametrize(
    "handler",
    [
        lambda request: (_ for _ in ()).throw(httpx.ReadTimeout("slow")),
        lambda request: httpx.Response(200, json={"message": {"content": "{"}}),
        lambda request: httpx.Response(404, json={"error": "missing"}),
    ],
)
def test_model_failure_falls_back_to_guided_match(monkeypatch, handler):
    mock_ollama(monkeypatch, handler)
    request = matching.MatchRequest.model_validate(match_payload())
    response = matching.request_matching(request)
    assert [(m.resident_id, m.source) for m in response.matches] == [
        ("camille", "guided")
    ]
    assert "entrepreneures" in response.matches[0].rationale


def test_match_requires_active_consent(monkeypatch):
    payload = match_payload()
    for resident in payload["residents"]:
        resident["consent"] = False
    local_client = MagicMock()
    monkeypatch.setattr(matching.httpx, "Client", local_client)
    with pytest.raises(HTTPException) as raised:
        matching.request_matching(matching.MatchRequest.model_validate(payload))
    assert raised.value.status_code == 422
    local_client.assert_not_called()


def test_demo_mode_serves_prewritten_texts_without_model(monkeypatch):
    local_client = MagicMock()
    monkeypatch.setattr(matching.httpx, "Client", local_client)
    monkeypatch.setattr(matching, "DEMO_MODE", True)
    monkeypatch.setattr(matching, "DEMO_DELAY", 0)
    request = matching.MatchRequest.model_validate(match_payload())
    response = matching.request_matching(request)
    assert [(m.resident_id, m.source) for m in response.matches] == [("camille", "ai")]
    assert "projet indépendant" in response.matches[0].rationale
    local_client.assert_not_called()


def test_match_explains_which_goals_and_skills_are_shared(monkeypatch):
    mock_ollama(monkeypatch, lambda request: httpx.Response(500))
    payload = match_payload()
    payload["residents"][0]["skills"] = ["Accueil", "Gestion de projet"]
    response = matching.request_matching(matching.MatchRequest.model_validate(payload))
    reasons = [(item.kind, item.text) for item in response.matches[0].reasons]
    assert reasons == [
        ("goal", "Rencontrer des entrepreneures"),
        ("skill", "Gestion de projet"),
    ]
