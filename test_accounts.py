import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect

import db
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


def test_resident_signs_up_and_stays_signed_in(client):
    created = client.post("/api/auth/register", json=RESIDENT)
    assert created.status_code == 201
    assert created.json()["email"] == "marie@example.org"
    assert client.get("/api/auth/me").json()["name"] == "Marie"


def test_sign_out_ends_the_session(client):
    client.post("/api/auth/register", json=RESIDENT)
    token = client.cookies.get("marthe_session")
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401
    # The old token no longer works even if someone kept a copy.
    client.cookies.set("marthe_session", token)
    assert client.get("/api/auth/me").status_code == 401


def test_sign_in_checks_password_and_space(client):
    client.post("/api/auth/register", json=RESIDENT)
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
    association = {**RESIDENT, "email": "asso@example.org", "space": "partenaires"}
    assert client.post("/api/auth/register", json=association).status_code == 403
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
