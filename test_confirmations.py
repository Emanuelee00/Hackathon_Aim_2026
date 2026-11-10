import mailer
from sharing import confirmations
from sharing.forms import router as forms_router
from test_store import client_as  # noqa: F401  (pytest fixture)

REQUEST = {
    "title": "Atelier danse",
    "space": "chapelle",
    "date": "2099-02-01",
    "start": "18:00",
    "end": "20:00",
    "participants": 25,
    "organizer": "Awa",
    "email": "awa@soleil.org",
}
CONTACT = {
    "name": "Awa",
    "email": "awa@soleil.org",
    "subject": "Visite",
    "message": "Peut-on visiter le lieu ?",
}


def outbox(monkeypatch, configured=True):
    sent = []
    monkeypatch.setattr(mailer, "configured", lambda: configured)
    monkeypatch.setattr(mailer, "deliver", lambda mail: sent.append(mail) or True)
    confirmations._by_address.clear()
    confirmations._all.clear()
    return sent


def test_a_request_gets_a_confirmation_at_the_address_given(client_as, monkeypatch):  # noqa: F811
    sent = outbox(monkeypatch)
    visitor = client_as(None)
    visitor.app.include_router(forms_router)
    answer = visitor.post("/api/requests", json=REQUEST)
    assert (answer.status_code, answer.json()["confirmation"]) == (201, True)
    [mail] = sent
    body = mail.get_content()
    assert mail["To"] == "awa@soleil.org"
    assert "bien reçu votre demande" in mail["Subject"]
    assert "Bonjour Awa," in body
    assert "La Chapelle" in body
    assert "dimanche 1 février 2099" in body
    assert "de 18:00 à 20:00" in body
    assert "Nombre de personnes : 25" in body
    assert "pas encore acceptée" in body
    assert "contact@chezmarthe.org" in body
    assert mail["From"] == "Bonjour Chez Marthe <contact@chezmarthe.org>"
    assert mail["Reply-To"] == "contact@chezmarthe.org"


def test_the_contact_page_gets_a_confirmation_too(client_as, monkeypatch):  # noqa: F811
    sent = outbox(monkeypatch)
    visitor = client_as(None)
    visitor.app.include_router(forms_router)
    assert visitor.post("/api/contact", json=CONTACT).status_code == 201
    [mail] = sent
    assert mail["To"] == "awa@soleil.org"
    assert "Peut-on visiter le lieu ?" in mail.get_content()
    assert "Sujet : Visite" in mail.get_content()


def test_nothing_is_sent_for_robots_bad_addresses_or_without_a_mail_service(
    client_as,  # noqa: F811
    monkeypatch,
):
    sent = outbox(monkeypatch)
    visitor = client_as(None)
    visitor.app.include_router(forms_router)
    assert (
        visitor.post(
            "/api/contact", json={**CONTACT, "website": "spam.example"}
        ).status_code
        == 201
    )
    assert (
        visitor.post(
            "/api/contact", json={**CONTACT, "email": "pas-un-email"}
        ).status_code
        == 422
    )
    assert (
        visitor.post("/api/requests", json={**REQUEST, "email": ""}).status_code == 422
    )
    assert sent == []
    outbox(monkeypatch, configured=False)
    answer = visitor.post("/api/requests", json=REQUEST)
    assert (answer.status_code, answer.json()["confirmation"]) == (201, False)


def test_a_mail_failure_does_not_fail_the_form(client_as, monkeypatch):  # noqa: F811
    outbox(monkeypatch)

    def broken(mail):
        raise OSError("serveur injoignable")

    monkeypatch.setattr(mailer, "deliver", broken)
    visitor = client_as(None)
    visitor.app.include_router(forms_router)
    assert visitor.post("/api/requests", json=REQUEST).status_code == 201


def test_the_same_address_gets_three_confirmations_a_day_at_most(
    client_as,  # noqa: F811
    monkeypatch,
):
    sent = outbox(monkeypatch)
    visitor = client_as(None)
    visitor.app.include_router(forms_router)
    for _ in range(5):
        assert visitor.post("/api/contact", json=CONTACT).status_code == 201
    assert len(sent) == 3
    assert confirmations.allowed("autre@exemple.org")
