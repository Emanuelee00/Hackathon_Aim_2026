import re
from pathlib import Path

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
from sharing import identity
from sharing.forms import router as forms_router
from sharing.qr import router as qr_router
from sharing.routes import router

WEB = Path(__file__).parent / "web" / "src"
ACCOUNTS = {
    "equipe": ("coord@marthe.fr", "Coordinatrice"),
    "residents": ("marie@marthe.fr", "Marie"),
    "benevoles": ("paul@x.fr", "Paul"),
    "partenaires": ("asso@x.fr", "Benenova"),
}
EVENTS = [
    {
        "id": "yoga",
        "title": "Yoga",
        "date": "2020-01-10",
        "start": "10:00",
        "end": "12:00",
        "space": "salon",
        "status": "confirmed",
        "email": "s@x.org",
        "revenue": 80,
        "tasks": [],
        "volunteerNeeds": [{"id": "accueil", "role": "Accueil", "needed": 2}],
        "volunteers": [{"id": "v1", "needId": "accueil", "name": "Nadia"}],
    },
]
MATCHES = [
    {
        "id": "yoga-marie",
        "eventId": "yoga",
        "resident_id": "marie",
        "status": "proposed",
        "journey": {"contact": "Julie"},
    },
    {
        "id": "photo-marie",
        "eventId": "photo",
        "resident_id": "marie",
        "status": "suggested",
    },
    {
        "id": "yoga-camille",
        "eventId": "yoga",
        "resident_id": "camille",
        "status": "proposed",
    },
]


@pytest.fixture
def client_as(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "engine", create_engine(f"sqlite:///{tmp_path}/test.db"))
    monkeypatch.setattr(store, "DATABASE_URL", None)
    monkeypatch.setattr(store, "SQLITE_PATH", tmp_path / "test.db")
    db.migrate()
    with Session(db.engine) as session:
        session.add_all(
            User(
                email=email,
                name=name,
                role=role,
                password_hash=hash_password("12345678"),
            )
            for role, (email, name) in ACCOUNTS.items()
        )
        session.commit()
    app = FastAPI()
    for included in (router, forms_router, qr_router, accounts_router):
        app.include_router(included)

    def sign_in(role):
        client = TestClient(app)
        if role:
            form = {"email": ACCOUNTS[role][0], "password": "12345678", "space": role}
            assert client.post("/api/auth/login", json=form).status_code == 200
        return client

    return sign_in


def test_team_reads_and_replaces_documents(client_as):
    team = client_as("equipe")
    assert team.get("/api/store/events").status_code == 404
    team.put("/api/store/matches", json=[{"id": "a", "status": "suggested"}])
    team.put("/api/store/matches", json=[{"id": "a", "status": "accepted"}])
    assert team.get("/api/store/matches").json() == {
        "value": [{"id": "a", "status": "accepted"}]
    }
    assert team.put("/api/store/secrets", json=[]).status_code == 422
    assert team.put("/api/store/events", json={"id": "a"}).status_code == 422


def test_signed_out_visitors_see_and_change_nothing(client_as):
    visitor = client_as(None)
    for key in ("events", "matches", "partners", "visitSlots"):
        assert visitor.get(f"/api/store/{key}").status_code == 401
        assert visitor.put(f"/api/store/{key}", json=[]).status_code == 401


def test_other_spaces_cannot_write_what_is_not_theirs(client_as):
    for role, key in [
        ("residents", "events"),
        ("benevoles", "matches"),
        ("partenaires", "visitSlots"),
        ("residents", "partners"),
    ]:
        assert client_as(role).put(f"/api/store/{key}", json=[]).status_code == 403


def test_events_hide_contacts_money_and_other_volunteers(client_as):
    store.save_document("events", EVENTS)
    [event] = client_as("benevoles").get("/api/store/events").json()["value"]
    assert "email" not in event and "revenue" not in event
    assert event["volunteers"] == [{"id": "v1", "needId": "accueil", "name": ""}]
    assert client_as("residents").get("/api/store/visitSlots").json() == {"value": []}


def test_volunteer_only_changes_own_signups(client_as):
    store.save_document("events", EVENTS)
    volunteer = client_as("benevoles")
    [event] = volunteer.get("/api/store/events").json()["value"]
    forged = {
        **event,
        "title": "Changé",
        "volunteers": [{"id": "v2", "needId": "accueil", "name": "Paul"}],
    }
    assert volunteer.put("/api/store/events", json=[forged]).status_code == 200
    [saved] = store.load_document("events")
    assert saved["title"] == "Yoga" and saved["email"] == "s@x.org"
    assert [v["name"] for v in saved["volunteers"]] == ["Nadia", "Paul"]


def test_resident_sees_and_answers_only_her_proposals(client_as):
    store.save_document("matches", MATCHES)
    resident = client_as("residents")
    [mine] = resident.get("/api/store/matches").json()["value"]
    assert mine["id"] == "yoga-marie"
    changed = [
        {**mine, "status": "accepted", "journey": None},
        {**MATCHES[2], "status": "declined"},
    ]
    resident.put("/api/store/matches", json=changed)
    saved = {match["id"]: match for match in store.load_document("matches")}
    assert saved["yoga-marie"]["status"] == "accepted"
    assert saved["yoga-marie"]["journey"] == {"contact": "Julie"}
    assert saved["yoga-camille"]["status"] == "proposed"


def test_laughs_stay_with_the_person_who_shared_them(client_as):
    store.save_document(
        "laughs", [{"id": "old", "owner": "other", "date": "2026-09-01"}]
    )
    volunteer = client_as("benevoles")
    forged = {"id": "l1", "owner": "other", "date": "2026-09-24"}
    assert volunteer.put("/api/store/laughs", json=[forged]).status_code == 200
    assert (
        volunteer.put("/api/store/laughs", json=[forged, {"id": "x"}]).status_code
        == 200
    )
    [mine] = volunteer.get("/api/store/laughs").json()["value"]
    assert mine["id"] == "l1" and mine["owner"] != "other"
    assert client_as("residents").get("/api/store/laughs").json() == {"value": []}
    assert client_as("partenaires").put("/api/store/laughs", json=[]).status_code == 403
    assert len(store.load_document("laughs")) == 2


def test_association_adds_bookings_only_in_its_name(client_as):
    store.save_document("events", EVENTS)
    partner = client_as("partenaires")
    booking = {
        "id": "event-1",
        "title": "Réunion",
        "space": "reunion",
        "date": "2099-01-01",
        "start": "10:00",
        "end": "12:00",
        "organizer": "Autre",
        "status": "confirmed",
    }
    changed_yoga = {**EVENTS[0], "status": "cancelled"}
    assert (
        partner.put("/api/store/events", json=[changed_yoga, booking]).status_code
        == 200
    )
    yoga, added = store.load_document("events")
    assert yoga["status"] == "confirmed"
    assert (added["organizer"], added["status"]) == ("Benenova", "pending")
    bad = {**booking, "id": "event-2", "space": "inconnu"}
    assert partner.put("/api/store/events", json=[bad]).status_code == 422
    partner.put(
        "/api/store/partners",
        json=[{"id": "benenova", "mapped": True}, {"id": "cantines", "mapped": False}],
    )
    assert store.load_document("partners") == [{"id": "benenova", "mapped": True}]


def test_public_request_and_bilan_add_one_thing_each(client_as):
    store.save_document("events", EVENTS)
    visitor = client_as(None)
    request = {
        "title": "Atelier",
        "space": "atelier",
        "date": "2099-02-01",
        "start": "18:00",
        "end": "20:00",
        "organizer": "Asso",
        "email": "a@asso.org",
        "status": "confirmed",
        "tasks": ["x"],
    }
    assert visitor.post("/api/requests", json=request).status_code == 201
    added = store.load_document("events")[-1]
    assert (added["status"], added["tasks"]) == ("pending", [])
    [held] = visitor.get("/api/feedback/events").json()
    assert held == {
        "id": "yoga",
        "title": "Yoga",
        "date": "2020-01-10",
        "space": "salon",
        "status": "confirmed",
        "organizerFeedback": False,
    }
    bilan = {"rating": 5, "attendance": 12, "residents": "yes"}
    assert visitor.post("/api/feedback/yoga", json=bilan).status_code == 201
    assert visitor.post("/api/feedback/yoga", json=bilan).status_code == 409


def test_only_the_team_makes_qr_codes(client_as):
    link = "/api/qr.svg?text=https://bilan.chezmarthe.site/?event=yoga"
    response = client_as("equipe").get(link)
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/svg+xml"
    assert response.text.startswith("<?xml") and "<svg" in response.text
    assert client_as(None).get(link).status_code == 401
    assert client_as("partenaires").get(link).status_code == 403
    assert client_as("equipe").get("/api/qr.svg?text=").status_code == 422


def test_mirrors_match_the_frontend_data():
    residents = (WEB / "features/opportunities/data/residents.js").read_text()
    pairs = dict(re.findall(r"id: '([^']+)', email: '([^']+)'", residents))
    assert {email: id_ for id_, email in pairs.items()} == identity.DEMO_RESIDENTS
    associations = (WEB / "shared/data/associations.js").read_text()
    assert (
        dict(re.findall(r"\{ id: '([^']+)', name: '([^']+)'", associations))
        == identity.ASSOCIATIONS
    )
    spaces = (WEB / "shared/data/spaces.js").read_text()
    assert set(re.findall(r"\{ id: '([^']+)'", spaces)) == identity.SPACES
