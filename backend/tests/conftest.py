"""Fixtures shared by the backend tests: `client_as(role)` signs in to a fresh database."""

import pytest
from core import db, store
from fastapi import FastAPI
from fastapi.testclient import TestClient
from features.accounts.models import User
from features.accounts.passwords import hash_password
from features.accounts.routes import router as accounts_router
from features.public.forms import router as forms_router
from features.public.qr import router as qr_router
from features.sharing.routes import router
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

ACCOUNTS = {
    "equipe": ("coord@marthe.fr", "Coordinatrice"),
    "residents": ("marie@marthe.fr", "Marie"),
    "benevoles": ("paul@x.fr", "Paul"),
    "partenaires": ("asso@x.fr", "Benenova"),
}


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
