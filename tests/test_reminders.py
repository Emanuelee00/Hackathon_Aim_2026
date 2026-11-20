from datetime import date
from io import BytesIO

import pytest
from openpyxl import load_workbook

import store
from funding import reminders
from funding.excel import read_tracker
from funding.routes import router as funding_router
from funding.workbook import write_tracker
from test_store import client_as  # noqa: F401  (pytest fixture)


@pytest.fixture
def memory(monkeypatch):
    """The store in memory, and no mail service unless a test sets one."""
    documents = {}
    monkeypatch.setattr(store, "load_document", documents.get)
    monkeypatch.setattr(store, "save_document", documents.__setitem__)
    for name in ("RESEND_API_KEY", "SMTP_HOST", "REMINDER_TO", "MAIL_FROM"):
        monkeypatch.delenv(name, raising=False)
    return documents


def funder(**fields):
    return {"id": "a", "name": "Fondation Test", "status": "submitted", **fields}


def test_months_are_added_to_the_end_of_a_shorter_month():
    assert reminders.add_months(date(2026, 1, 31), 1) == date(2026, 2, 28)
    assert reminders.add_months(date(2026, 3, 15), 11) == date(2027, 2, 15)
    assert reminders.add_months(date(2026, 12, 1), 1) == date(2027, 1, 1)


def test_the_delay_is_eleven_months_unless_it_is_changed():
    base = {"obtainedOn": "2026-01-10"}
    assert reminders.reminder_date(funder(**base)) == date(2026, 12, 10)
    assert reminders.reminder_date(funder(**base, followupMonths=6)) == date(
        2026, 7, 10
    )
    assert reminders.reminder_date(funder(**base, followupMonths=0)) == date(
        2026, 12, 10
    )
    assert reminders.reminder_date(funder(obtainedOn="")) is None
    assert reminders.reminder_date(funder(obtainedOn="pas une date")) is None


def test_only_recent_unsent_reminders_of_possible_funders_are_due():
    today = date(2026, 12, 10)
    items = [
        funder(id="due", obtainedOn="2026-01-10"),
        funder(id="early", obtainedOn="2026-01-11"),
        funder(id="forgotten", obtainedOn="2025-01-01"),
        funder(id="sent", obtainedOn="2026-01-10"),
        funder(id="no", obtainedOn="2026-01-10", status="ineligible"),
        funder(id="undated"),
    ]
    found = reminders.due(items, today, {"sent:2026-12-10"})
    assert [item["id"] for item, _ in found] == ["due"]


def test_the_email_tells_who_to_contact_and_gives_the_chez_marthe_address():
    when = date(2026, 12, 10)
    item = funder(
        obtainedOn="2026-01-10",
        amount="30 000 €\nAutre",
        contact="Mme Durand",
        email="d@fondation.org",
        owner="Caro",
    )
    mail = reminders.message(item, when)
    body = mail.get_content()
    assert mail["To"] == "contact@chezmarthe.org"
    assert "Fondation Test" in mail["Subject"]
    assert "10/01/2026" in body
    assert "il y a 11 mois" in body
    assert "30 000 €" in body
    assert "d@fondation.org" in body
    assert "Autre" not in body
    assert "Contact Chez Marthe : contact@chezmarthe.org" in body


def test_without_a_mail_service_nothing_is_sent_and_it_is_retried(memory):
    memory["funders"] = [funder(obtainedOn="2026-01-10")]
    first = reminders.run(date(2026, 12, 10))
    assert [(item["name"], item["sent"]) for item in first] == [
        ("Fondation Test", False)
    ]
    assert reminders.SENT_KEY not in memory
    assert len(reminders.run(date(2026, 12, 11))) == 1


def test_each_reminder_is_sent_once(memory, monkeypatch):
    memory["funders"] = [funder(obtainedOn="2026-01-10")]
    monkeypatch.setenv("SMTP_HOST", "smtp.test")
    outbox = []
    monkeypatch.setattr(
        reminders, "deliver", lambda mail: outbox.append(mail["Subject"]) or True
    )
    assert reminders.run(date(2026, 12, 10))[0]["sent"] is True
    assert reminders.run(date(2026, 12, 10)) == []
    assert reminders.run(date(2026, 12, 11)) == []
    assert len(outbox) == 1


def test_a_dry_run_sends_nothing(memory, monkeypatch):
    memory["funders"] = [funder(obtainedOn="2026-01-10")]
    monkeypatch.setenv("SMTP_HOST", "smtp.test")
    monkeypatch.setattr(reminders, "deliver", lambda mail: pytest.fail("sent"))
    assert reminders.run(date(2026, 12, 10), dry=True)[0]["sent"] is False


def test_a_failed_send_is_not_marked_as_sent(memory, monkeypatch):
    memory["funders"] = [funder(obtainedOn="2026-01-10")]
    monkeypatch.setenv("SMTP_HOST", "smtp.test")

    def broken(mail):
        raise OSError("serveur injoignable")

    monkeypatch.setattr(reminders, "deliver", broken)
    assert reminders.run(date(2026, 12, 10))[0]["sent"] is False
    assert reminders.SENT_KEY not in memory


def test_the_obtained_day_and_the_delay_survive_the_excel_file():
    card = funder(
        id="x1", obtainedOn="2026-03-31", followupMonths=6, tasks=[], color=""
    )
    again = read_tracker(write_tracker([card]))[0]
    assert (again["obtainedOn"], again["followupMonths"]) == ("2026-03-31", 6)
    sheet = load_workbook(BytesIO(write_tracker([card])))["Retroplanning"]
    assert sheet["U1"].value == "Obtenu le (site)"
    fresh = read_tracker(write_tracker([funder(id="x2", tasks=[], color="")]))[0]
    assert (fresh["obtainedOn"], fresh["followupMonths"]) == ("", 11)


def test_a_date_chosen_by_hand_replaces_the_eleven_months():
    item = funder(obtainedOn="2026-01-10", followupOn="2026-10-05")
    assert reminders.reminder_date(item) == date(2026, 10, 5)
    assert reminders.reminder_date(funder(followupOn="2026-10-05")) == date(2026, 10, 5)
    assert reminders.reminder_date(
        funder(obtainedOn="2026-01-10", followupOn="")
    ) == date(2026, 12, 10)
    found = reminders.due(
        [funder(obtainedOn="2026-01-10", followupOn="2026-10-05")],
        date(2026, 10, 5),
        set(),
    )
    assert len(found) == 1


def test_the_chosen_reminder_day_survives_the_excel_file():
    card = funder(
        id="x3", obtainedOn="2026-01-10", followupOn="2026-10-05", tasks=[], color=""
    )
    again = read_tracker(write_tracker([card]))[0]
    assert again["followupOn"] == "2026-10-05"
    assert (
        read_tracker(write_tracker([funder(id="x4", tasks=[], color="")]))[0][
            "followupOn"
        ]
        == ""
    )


def test_a_test_email_is_sent_at_once_even_without_an_obtention_date(
    memory, monkeypatch
):
    monkeypatch.setenv("SMTP_HOST", "smtp.test")
    outbox = []
    monkeypatch.setattr(reminders, "deliver", lambda mail: outbox.append(mail))
    assert reminders.send_test(funder()) == "contact@chezmarthe.org"
    assert outbox[0]["Subject"].startswith("[TEST] ")
    assert "E-mail de test" in outbox[0].get_content()


def test_a_test_email_needs_a_mail_service(memory):
    with pytest.raises(reminders.NotConfigured):
        reminders.send_test(funder())


def test_only_the_team_sends_a_test_and_the_cron_needs_its_secret(
    client_as,  # noqa: F811
    memory,
    monkeypatch,
):
    team = client_as("equipe")
    team.app.include_router(funding_router)
    assert team.post("/api/funders/reminders/test", json=funder()).status_code == 503
    monkeypatch.setenv("SMTP_HOST", "smtp.test")
    monkeypatch.setattr(reminders, "deliver", lambda mail: True)
    assert team.post("/api/funders/reminders/test", json=funder()).json() == {
        "sent": True,
        "to": "contact@chezmarthe.org",
    }
    assert (
        client_as("residents")
        .post("/api/funders/reminders/test", json=funder())
        .status_code
        == 403
    )
    monkeypatch.setenv("CRON_SECRET", "secret")
    assert team.get("/api/funders/reminders/cron").status_code == 401
    assert team.get(
        "/api/funders/reminders/cron", headers={"Authorization": "Bearer secret"}
    ).json() == {"reminders": []}


def test_the_team_chooses_where_the_reminders_go(client_as, memory, monkeypatch):  # noqa: F811
    team = client_as("equipe")
    team.app.include_router(funding_router)
    assert team.get("/api/funders/reminders/settings").json() == {
        "email": "contact@chezmarthe.org",
        "default": "contact@chezmarthe.org",
    }
    assert (
        team.put(
            "/api/funders/reminders/settings", json={"email": "pas une adresse"}
        ).status_code
        == 422
    )
    chosen = team.put(
        "/api/funders/reminders/settings", json={"email": " Caro@Chezmarthe.org "}
    ).json()
    assert chosen["email"] == "caro@chezmarthe.org"
    assert (
        reminders.message(funder(obtainedOn="2026-01-10"), date(2026, 12, 10))["To"]
        == "caro@chezmarthe.org"
    )
    assert (
        client_as("residents")
        .put("/api/funders/reminders/settings", json={"email": "x@y.fr"})
        .status_code
        == 403
    )
    assert (
        team.put("/api/funders/reminders/settings", json={"email": ""}).json()["email"]
        == "contact@chezmarthe.org"
    )
    monkeypatch.setenv("REMINDER_TO", "equipe@chezmarthe.org")
    assert (
        team.get("/api/funders/reminders/settings").json()["email"]
        == "equipe@chezmarthe.org"
    )
