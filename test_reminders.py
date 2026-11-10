from datetime import date
from io import BytesIO

import pytest
from openpyxl import load_workbook

import store
from funding import reminders
from funding.excel import read_tracker
from funding.workbook import write_tracker


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
