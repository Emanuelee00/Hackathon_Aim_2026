import json
from unittest.mock import MagicMock

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import db
from accounts.models import User
from accounts.passwords import hash_password
from accounts.routes import router as accounts_router
from agents import llm
from agents.routes import router

QUESTION = [{"role": "user", "content": "Puis-je faire un barbecue au jardin ?"}]
HAND_OFF = {
    "tool_calls": [
        {
            "id": "call_1",
            "type": "function",
            "function": {
                "name": "transmettre_a_equipe",
                "arguments": json.dumps(
                    {"nom": "Asso Soleil", "email": "a@soleil.org", "resume": "BBQ"}
                ),
            },
        }
    ]
}


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "engine", create_engine(f"sqlite:///{tmp_path}/test.db"))
    db.migrate()
    with Session(db.engine) as session:
        for email, role in [("coord@marthe.fr", "equipe"), ("r@x.fr", "residents")]:
            session.add(
                User(
                    email=email,
                    name="X",
                    role=role,
                    password_hash=hash_password("12345678"),
                )
            )
        session.commit()
    app = FastAPI()
    app.include_router(router)
    app.include_router(accounts_router)
    return TestClient(app)


def sign_in(client, email, space):
    form = {"email": email, "password": "12345678", "space": space}
    assert client.post("/api/auth/login", json=form).status_code == 200


def test_agent_hands_the_question_off_to_the_team(client, monkeypatch):
    replies = iter([HAND_OFF, {"content": "C’est transmis : Q-1."}])
    monkeypatch.setattr(llm, "complete", lambda messages, tools: next(replies))
    response = client.post(
        "/api/agents/renseignements/chat", json={"messages": QUESTION}
    )
    assert response.json() == {"reply": "C’est transmis : Q-1.", "handoff": 1}
    sign_in(client, "coord@marthe.fr", "equipe")
    [question] = client.get("/api/questions").json()
    assert question["email"] == "a@soleil.org" and question["status"] == "new"
    assert question["transcript"] == QUESTION
    done = client.patch("/api/questions/1", json={"status": "done"})
    assert done.json()["status"] == "done"


def test_invalid_email_is_not_handed_off(client, monkeypatch):
    call = HAND_OFF["tool_calls"][0]
    bad = json.dumps({"nom": "A", "email": "pas-un-email", "resume": "BBQ"})
    seen = []

    def complete(messages, tools):
        seen.append(messages[-1])
        if len(seen) == 1:
            return {
                "tool_calls": [
                    {**call, "function": {**call["function"], "arguments": bad}}
                ]
            }
        return {"content": "Quelle est votre adresse e-mail ?"}

    monkeypatch.setattr(llm, "complete", complete)
    response = client.post(
        "/api/agents/renseignements/chat", json={"messages": QUESTION}
    )
    assert response.json()["handoff"] is None
    assert "e-mail valide" in seen[1]["content"]


def test_only_the_team_reads_questions(client):
    assert client.get("/api/questions").status_code == 401
    sign_in(client, "r@x.fr", "residents")
    assert client.get("/api/questions").status_code == 403
    assert client.patch("/api/questions/1", json={"status": "done"}).status_code == 403


def test_openai_failures(client, monkeypatch):
    assert (
        client.post("/api/agents/inconnu/chat", json={"messages": QUESTION}).status_code
        == 404
    )
    monkeypatch.setattr(llm, "complete", MagicMock(side_effect=httpx.ConnectError("x")))
    response = client.post(
        "/api/agents/renseignements/chat", json={"messages": QUESTION}
    )
    assert response.status_code == 503
    # Once the question is saved, a failing final answer still confirms it.
    monkeypatch.setattr(
        llm, "complete", MagicMock(side_effect=[HAND_OFF, httpx.ReadTimeout("x")])
    )
    response = client.post(
        "/api/agents/renseignements/chat", json={"messages": QUESTION}
    )
    assert response.json()["handoff"] == 1 and "Q-1" in response.json()["reply"]


def test_complete_sends_key_and_tools(monkeypatch):
    requests = []
    transport = httpx.MockTransport(
        lambda request: (
            requests.append(request)
            or httpx.Response(200, json={"choices": [{"message": {"content": "Oui"}}]})
        )
    )
    monkeypatch.setenv("OPENAI_API", "sk-test")
    monkeypatch.setattr(
        llm.httpx, "Client", MagicMock(return_value=httpx.Client(transport=transport))
    )
    tool = llm.Tool("outil", "Un outil", {"type": "object"}, lambda args, context: "")
    assert llm.complete([{"role": "user", "content": "?"}], (tool,)) == {
        "content": "Oui"
    }
    assert requests[0].headers["authorization"] == "Bearer sk-test"
    assert json.loads(requests[0].content)["tools"][0]["function"]["name"] == "outil"
