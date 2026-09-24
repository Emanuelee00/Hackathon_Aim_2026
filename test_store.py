import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import store


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(store, "DATABASE_URL", None)
    monkeypatch.setattr(store, "SQLITE_PATH", tmp_path / "marthe.db")
    app = FastAPI()
    app.include_router(store.router)
    return TestClient(app)


def test_nothing_saved_yet_is_not_found(client):
    assert client.get("/api/store/events").status_code == 404


def test_saved_document_is_read_back_and_replaced(client):
    client.put("/api/store/matches", json=[{"id": "a", "status": "suggested"}])
    client.put("/api/store/matches", json=[{"id": "a", "status": "accepted"}])
    assert client.get("/api/store/matches").json() == {
        "value": [{"id": "a", "status": "accepted"}]
    }


def test_unknown_keys_and_non_lists_are_refused(client):
    assert client.put("/api/store/secrets", json=[]).status_code == 422
    assert client.put("/api/store/events", json={"id": "a"}).status_code == 422


def test_partner_associations_are_shared(client):
    client.put("/api/store/partners", json=[{"id": "benenova", "synced": True}])
    assert client.get("/api/store/partners").json() == {
        "value": [{"id": "benenova", "synced": True}]
    }
