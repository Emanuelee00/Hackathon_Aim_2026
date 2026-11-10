from datetime import date

import mailer
import messages
import store
from funding import reminders
from sharing import confirmations
from sharing.forms import router as forms_router
from sharing.models import EventDraft
from test_store import client_as  # noqa: F401  (pytest fixture)

DRAFT = EventDraft(
    title="Atelier danse",
    space="chapelle",
    date="2099-02-01",
    start="18:00",
    end="20:00",
    participants=25,
    organizer="Awa",
    email="awa@soleil.org",
)


def memory(monkeypatch):
    documents = {}
    monkeypatch.setattr(store, "load_document", documents.get)
    monkeypatch.setattr(store, "save_document", documents.__setitem__)
    return documents


def test_variables_are_replaced_and_unknown_ones_are_left_as_written():
    assert (
        messages.render("Bonjour {nom} {autre}", {"nom": "Awa"})
        == "Bonjour Awa {autre}"
    )
    assert (
        messages.render("{a}", {"a": "{nom}", "nom": "X"}) == "{nom}"
    )  # a value is never read again


def test_the_original_texts_are_used_until_the_team_saves_its_own(monkeypatch):
    memory(monkeypatch)
    assert messages.current("request")[0] == messages.BY_ID["request"].subject
    assert not messages.describe(messages.BY_ID["request"])["custom"]


def test_a_saved_text_becomes_the_confirmation_that_is_sent(client_as, monkeypatch):  # noqa: F811
    team = client_as("equipe")
    team.app.include_router(messages.router)
    saved = team.put(
        "/api/messages/request",
        json={
            "subject": "Bien reçu, {nom} !",
            "body": "Salut {nom}, ton projet « {projet} » est noté pour {espace}, le {date}.",
        },
    )
    assert saved.status_code == 200 and saved.json()["custom"] is True
    mail = confirmations.request_message(DRAFT)
    assert mail["Subject"] == "Bien reçu, Awa !"
    assert (
        mail.get_content().strip()
        == "Salut Awa, ton projet « Atelier danse » est noté pour La Chapelle, le dimanche 1 février 2099."
    )
    reset = team.delete("/api/messages/request").json()
    assert reset["custom"] is False
    assert "bien reçu votre demande" in confirmations.request_message(DRAFT)["Subject"]


def test_the_funding_reminder_uses_the_saved_text(client_as, monkeypatch):  # noqa: F811
    team = client_as("equipe")
    team.app.include_router(messages.router)
    team.put(
        "/api/messages/funding-reminder",
        json={
            "subject": "À relancer : {financeur}",
            "body": "Pensez à {financeur} ({montant}). {contact}",
        },
    )
    funder = {
        "id": "a",
        "name": "Fondation X",
        "amount": "30 000 €",
        "obtainedOn": "2026-01-10",
    }
    mail = reminders.message(funder, date(2026, 12, 10))
    assert mail["Subject"] == "À relancer : Fondation X"
    assert (
        mail.get_content().strip()
        == "Pensez à Fondation X (30 000 €). contact@chezmarthe.org"
    )
    assert reminders.message(funder, date(2026, 12, 10), test=True)[
        "Subject"
    ].startswith("[TEST] ")


def test_only_the_team_edits_the_messages_and_bad_texts_are_refused(client_as):  # noqa: F811
    team = client_as("equipe")
    team.app.include_router(messages.router)
    listed = team.get("/api/messages").json()
    assert [t["id"] for t in listed["templates"]] == [
        "request",
        "contact",
        "funding-reminder",
    ]
    assert listed["sender"]["replyTo"] == "contact@chezmarthe.org"
    request = listed["templates"][0]
    assert request["preview"]["subject"] == request["subject"]
    assert "Bonjour Awa," in request["preview"]["body"]
    unknown = team.put(
        "/api/messages/request", json={"subject": "Salut", "body": "Bonjour {prenom}"}
    )
    assert unknown.status_code == 422 and "{prenom}" in unknown.json()["detail"]
    assert (
        team.put(
            "/api/messages/request", json={"subject": "Deux\nlignes", "body": "ok"}
        ).status_code
        == 422
    )
    assert (
        team.put(
            "/api/messages/request", json={"subject": "", "body": "ok"}
        ).status_code
        == 422
    )
    assert (
        team.put(
            "/api/messages/inconnu", json={"subject": "a", "body": "b"}
        ).status_code
        == 404
    )
    resident = client_as("residents")
    assert resident.get("/api/messages").status_code == 403
    assert (
        resident.put(
            "/api/messages/request", json={"subject": "a", "body": "b"}
        ).status_code
        == 403
    )
    assert client_as(None).get("/api/messages").status_code in (401, 403)


def test_a_form_then_sends_the_edited_text(client_as, monkeypatch):  # noqa: F811
    sent = []
    monkeypatch.setattr(mailer, "configured", lambda: True)
    monkeypatch.setattr(mailer, "deliver", lambda mail: sent.append(mail) or True)
    confirmations._by_address.clear()
    confirmations._all.clear()
    team = client_as("equipe")
    team.app.include_router(messages.router)
    team.app.include_router(forms_router)
    team.put(
        "/api/messages/contact",
        json={"subject": "Merci {nom}", "body": "On a lu : {message}"},
    )
    body = {
        "name": "Awa",
        "email": "awa@soleil.org",
        "subject": "Visite",
        "message": "Peut-on visiter ?",
    }
    assert client_as(None).post("/api/contact", json=body).status_code == 201
    assert (sent[0]["Subject"], sent[0].get_content().strip()) == (
        "Merci Awa",
        "On a lu : Peut-on visiter ?",
    )
