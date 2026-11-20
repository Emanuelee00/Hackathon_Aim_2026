import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session

import db
from accounts.models import User
from accounts.passwords import hash_password, verify_password
from accounts.routes import router

RESIDENT = {
    "name": "Marie",
    "email": "Marie@Example.org",
    "password": "un mot de passe",
    "space": "residents",
}


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "engine", create_engine(f"sqlite:///{tmp_path}/test.db"))
    db.migrate()
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_migrations_create_the_account_tables(client):
    assert {"users", "sessions"} <= set(inspect(db.engine).get_table_names())


def test_passwords_are_salted_and_verified():
    first, second = hash_password("secret123"), hash_password("secret123")
    assert first != second and "secret123" not in first
    assert verify_password("secret123", first)
    assert not verify_password("secret124", first)


def sign_in_team(client):
    with Session(db.engine) as session:
        session.add(
            User(
                email="coord@marthe.fr",
                name="Coordinatrice",
                role="equipe",
                password_hash=hash_password("mot de passe équipe"),
            )
        )
        session.commit()
    login = {"email": "coord@marthe.fr", "password": "mot de passe équipe"}
    return client.post("/api/auth/login", json={**login, "space": "equipe"})


def approved_resident(client):
    client.post("/api/auth/register", json=RESIDENT)
    sign_in_team(client)
    request_id = client.get("/api/auth/requests").json()[0]["id"]
    client.post(f"/api/auth/requests/{request_id}/approve")
    client.post("/api/auth/logout")
    login = {"email": "marie@example.org", "password": RESIDENT["password"]}
    return client.post("/api/auth/login", json={**login, "space": "residents"})


def test_resident_sign_up_is_a_request_until_the_team_validates(client):
    created = client.post("/api/auth/register", json=RESIDENT)
    assert created.status_code == 202 and created.json()["pending"]
    assert client.get("/api/auth/me").status_code == 401
    login = {"email": "marie@example.org", "password": RESIDENT["password"]}
    waiting = client.post("/api/auth/login", json={**login, "space": "residents"})
    assert waiting.status_code == 403
    sign_in_team(client)
    requests = client.get("/api/auth/requests").json()
    assert [request["email"] for request in requests] == ["marie@example.org"]
    client.post(f"/api/auth/requests/{requests[0]['id']}/approve")
    assert client.get("/api/auth/requests").json() == []
    client.post("/api/auth/logout")
    signed_in = client.post("/api/auth/login", json={**login, "space": "residents"})
    assert signed_in.status_code == 200
    assert client.get("/api/auth/me").json()["name"] == "Marie"


def test_association_request_can_be_rejected(client):
    association = {**RESIDENT, "email": "asso@example.org", "space": "partenaires"}
    assert client.post("/api/auth/register", json=association).status_code == 202
    sign_in_team(client)
    request_id = client.get("/api/auth/requests").json()[0]["id"]
    assert client.delete(f"/api/auth/requests/{request_id}").status_code == 204
    assert client.get("/api/auth/requests").json() == []
    # The address is free again for a new request.
    assert client.post("/api/auth/register", json=association).status_code == 202


def test_only_the_team_sees_and_validates_requests(client):
    approved_resident(client)
    assert client.get("/api/auth/requests").status_code == 403
    assert client.post("/api/auth/requests/1/approve").status_code == 403
    client.post("/api/auth/logout")
    assert client.get("/api/auth/requests").status_code == 401


def test_sign_out_ends_the_session(client):
    approved_resident(client)
    token = client.cookies.get("marthe_session")
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401
    # The old token no longer works even if someone kept a copy.
    client.cookies.set("marthe_session", token)
    assert client.get("/api/auth/me").status_code == 401


def test_sign_in_checks_password_and_space(client):
    approved_resident(client)
    client.post("/api/auth/logout")
    login = {"email": "marie@example.org", "password": RESIDENT["password"]}
    wrong = client.post(
        "/api/auth/login", json={**login, "password": "x" * 8, "space": "residents"}
    )
    other_space = client.post("/api/auth/login", json={**login, "space": "equipe"})
    assert wrong.status_code == other_space.status_code == 401
    assert (
        client.post("/api/auth/login", json={**login, "space": "residents"}).status_code
        == 200
    )
    assert client.get("/api/auth/me").status_code == 200


def test_team_accounts_and_duplicates_are_refused(client):
    team = client.post("/api/auth/register", json={**RESIDENT, "space": "equipe"})
    assert team.status_code == 403
    client.post("/api/auth/register", json=RESIDENT)
    again = client.post(
        "/api/auth/register", json={**RESIDENT, "email": "marie@example.org"}
    )
    assert again.status_code == 409
    short = client.post("/api/auth/register", json={**RESIDENT, "password": "court"})
    assert short.status_code == 422


def test_volunteers_can_sign_up(client):
    volunteer = {**RESIDENT, "email": "camille@example.org", "space": "benevoles"}
    created = client.post("/api/auth/register", json=volunteer)
    assert created.status_code == 201
    assert created.json()["role"] == "benevoles"
