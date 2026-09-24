import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import db
import store
from accounts.models import User
from accounts.passwords import hash_password
from accounts.routes import router as accounts_router
from agents import benevoles, llm, partenaires, residents
from agents.llm import Context
from agents.routes import router

ASK = {"messages": [{"role": "user", "content": "Qu’est-ce que j’ai de prévu ?"}]}
EVENTS = [
    {
        "id": "yoga",
        "title": "Yoga",
        "date": "2099-01-10",
        "start": "10:00",
        "end": "12:00",
        "space": "salon",
        "status": "confirmed",
        "organizer": "Sista4good",
        "email": "s@x.org",
        "revenue": 80,
        "opportunity": "Places offertes",
        "volunteerNeeds": [{"id": "accueil", "role": "Accueil", "needed": 2}],
        "volunteers": [{"needId": "accueil", "name": "Paul"}],
    },
    {
        "id": "photo",
        "title": "Photo",
        "date": "2099-01-11",
        "start": "14:00",
        "end": "17:00",
        "space": "atelier",
        "status": "pending",
        "organizer": "Collectif",
        "email": "c@x.org",
    },
]
MATCHES = [
    {"eventId": "yoga", "resident_id": "lea", "status": "accepted"},
    {"eventId": "photo", "resident_id": "lea", "status": "suggested"},
    {"eventId": "photo", "resident_id": "marie", "status": "proposed"},
]
ACCOUNTS = [
    ("coord@marthe.fr", "Coordinatrice", "equipe"),
    ("lea@marthe.fr", "Léa Martin", "residents"),
    ("asso@x.fr", "Sista4good", "partenaires"),
    ("paul@x.fr", "Paul", "benevoles"),
]


@pytest.fixture
def users(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "engine", create_engine(f"sqlite:///{tmp_path}/test.db"))
    monkeypatch.setattr(store, "DATABASE_URL", None)
    monkeypatch.setattr(store, "SQLITE_PATH", tmp_path / "test.db")
    db.migrate()
    store.save_document("events", EVENTS)
    store.save_document("matches", MATCHES)
    session = Session(db.engine, expire_on_commit=False)
    accounts = {
        role: User(
            email=email, name=name, role=role, password_hash=hash_password("12345678")
        )
        for email, name, role in ACCOUNTS
    }
    session.add_all(accounts.values())
    session.commit()
    yield session, accounts
    session.close()


def client_as(role):
    app = FastAPI()
    app.include_router(router)
    app.include_router(accounts_router)
    client = TestClient(app)
    if role:
        email = next(email for email, _, r in ACCOUNTS if r == role)
        form = {"email": email, "password": "12345678", "space": role}
        assert client.post("/api/auth/login", json=form).status_code == 200
    return client


@pytest.mark.parametrize(
    "role, agent, expected",
    [
        (None, "renseignements", 200),
        (None, "residents", 401),
        ("residents", "equipe", 403),
        ("partenaires", "residents", 403),
        ("residents", "residents", 200),
        ("equipe", "equipe", 200),
    ],
)
def test_each_agent_only_talks_to_its_space(users, monkeypatch, role, agent, expected):
    monkeypatch.setattr(llm, "complete", lambda messages, tools: {"content": "Ok"})
    response = client_as(role).post(f"/api/agents/{agent}/chat", json=ASK)
    assert response.status_code == expected


def run(tool, session, user, **arguments):
    return json.loads(tool.run(arguments, Context(session, [], user=user)))


def test_resident_sees_only_her_sent_proposals(users):
    session, accounts = users
    [mine] = run(residents.AGENT.tools[0], session, accounts["residents"])
    # Léa's suggestion not sent yet and Marie's proposal stay hidden.
    assert mine["title"] == "Yoga" and "Elle participe" in mine["statut"]
    [open_to_all] = run(residents.AGENT.tools[1], session, accounts["residents"])
    assert "email" not in open_to_all and "organizer" not in open_to_all


def test_association_sees_other_bookings_without_details(users):
    session, accounts = users
    [booking] = run(partenaires.AGENT.tools[0], session, accounts["partenaires"])
    assert booking["title"] == "Yoga"
    taken = run(
        partenaires.AGENT.tools[1],
        session,
        accounts["partenaires"],
        debut="2099-01-01",
        fin="2099-12-31",
    )
    assert taken[1] == {
        "space": "atelier",
        "date": "2099-01-11",
        "start": "14:00",
        "end": "17:00",
    }


def test_volunteer_sees_places_but_not_other_names(users):
    session, accounts = users
    [mission] = run(benevoles.AGENT.tools[0], session, accounts["benevoles"])
    assert mission["roles"] == [{"role": "Accueil", "places_libres": 1}]
    assert "Paul" not in json.dumps(mission)
    [signup] = run(benevoles.AGENT.tools[1], session, accounts["benevoles"])
    assert signup["role"] == "Accueil"


def test_signed_in_hand_off_uses_the_account_contact(users):
    session, accounts = users
    hand_off = residents.AGENT.tools[2]
    reply = hand_off.run(
        {"resume": "Besoin d’aide"}, Context(session, [], user=accounts["residents"])
    )
    assert "Q-1" in reply
    session.expire_all()
    team = client_as("equipe")
    [question] = team.get("/api/questions").json()
    assert (question["email"], question["agent"]) == ("lea@marthe.fr", "residents")
