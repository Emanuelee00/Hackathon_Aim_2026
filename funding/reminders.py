"""Yearly reminders: a month before the anniversary of an obtained funding, the team gets an email to ask the funder again.

Each funder has the day the funding was obtained (`obtainedOn`) and a delay in months (`followupMonths`, 11 by default,
editable): the reminder is due `followupMonths` after `obtainedOn`. It is sent once, to the team's address, with the funder's
details and the Chez Marthe contact. Without a mail service configured nothing is sent: the reminders are only listed.
"""

import calendar
import json
import logging
import os
import smtplib
import time
import urllib.request
from datetime import date, datetime
from email.message import EmailMessage
from threading import Thread
from zoneinfo import ZoneInfo

import store

from .excel import DEFAULT_FOLLOWUP_MONTHS

log = logging.getLogger("marthe.reminders")
PARIS = ZoneInfo("Europe/Paris")
SENT_KEY = (
    "funding_reminders"  # "funder id:reminder day", so a reminder leaves only once
)
SEND_HOUR = 8  # Paris time, every morning
LOOKBACK_DAYS = 14  # a reminder missed while the server was off still leaves, but old ones do not flood the team
SKIPPED = {"ineligible"}


def add_months(start: date, months: int) -> date:
    """The same day `months` later, or the month's last day (31 January + 1 month = 28 February)."""
    index = start.month - 1 + months
    year, month = start.year + index // 12, index % 12 + 1
    return date(year, month, min(start.day, calendar.monthrange(year, month)[1]))


def reminder_date(funder: dict) -> date | None:
    """The day the reminder leaves: the date chosen by hand (`followupOn`), or else the obtention day + `followupMonths` (11)."""
    try:
        return date.fromisoformat(str(funder.get("followupOn") or ""))
    except ValueError:
        pass
    try:
        obtained = date.fromisoformat(str(funder.get("obtainedOn") or ""))
    except ValueError:
        return None
    months = funder.get("followupMonths")
    if not isinstance(months, int) or isinstance(months, bool) or months <= 0:
        months = DEFAULT_FOLLOWUP_MONTHS
    return add_months(obtained, months)


def due(funders: list[dict], today: date, sent: set[str]) -> list[tuple[dict, date]]:
    result = []
    for funder in funders:
        when = reminder_date(funder)
        if not when or funder.get("status") in SKIPPED:
            continue
        recent = when <= today and (today - when).days <= LOOKBACK_DAYS
        if recent and f"{funder.get('id')}:{when}" not in sent:
            result.append((funder, when))
    return result


def french(day: date) -> str:
    return day.strftime("%d/%m/%Y")


def message(funder: dict, when: date, test: bool = False) -> EmailMessage:
    name = funder.get("name") or funder.get("type") or "Financeur sans nom"
    team = os.getenv("REMINDER_TO", "contact@chezmarthe.org")
    try:
        obtained = date.fromisoformat(str(funder.get("obtainedOn") or ""))
    except ValueError:  # a test on a funder whose obtention date is still empty
        obtained = add_months(when, -DEFAULT_FOLLOWUP_MONTHS)
    months = (when.year - obtained.year) * 12 + when.month - obtained.month
    lines = [
        "Bonjour,",
        "",
        *(
            [
                "[E-mail de test : cet envoi a été demandé à la main depuis la fiche du financeur.]",
                "",
            ]
            if test
            else []
        ),
        f"Rappel automatique : le financement de « {name} » a été obtenu le {french(obtained)}, il y a {months} mois.",
        "C'est le moment de les recontacter pour demander un nouveau financement.",
        "",
        f"Financeur : {name}" + (f" ({funder['type']})" if funder.get("type") else ""),
    ]
    amount = str(funder.get("amount") or "").strip().split("\n")[0]
    for label, key in (
        ("Aide obtenue", None),
        ("Contact", "contact"),
        ("Courriel", "email"),
        ("Téléphone", "phone"),
        ("Responsable", "owner"),
    ):
        value = amount if key is None else str(funder.get(key) or "").strip()
        if value:
            lines.append(f"{label} : {value}")
    lines += [
        "",
        f"Contact Chez Marthe : {team}",
        "",
        "— Intranet financements, Chez Marthe",
    ]
    mail = EmailMessage()
    mail["Subject"] = (
        f"{'[TEST] ' if test else ''}Rappel : recontacter {name} pour un nouveau financement"
    )
    mail["From"] = os.getenv("MAIL_FROM", f"Chez Marthe <{team}>")
    mail["To"] = team
    mail.set_content("\n".join(lines))
    return mail


def configured() -> bool:
    return bool(os.getenv("RESEND_API_KEY") or os.getenv("SMTP_HOST"))


def deliver(mail: EmailMessage) -> bool:
    """Sends through Resend or an SMTP server; False when no mail service is configured."""
    if key := os.getenv("RESEND_API_KEY"):
        body = json.dumps(
            {
                "from": mail["From"],
                "to": [mail["To"]],
                "subject": mail["Subject"],
                "text": mail.get_content(),
            }
        ).encode()
        request = urllib.request.Request(
            "https://api.resend.com/emails",
            body,
            {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        )
        urllib.request.urlopen(request, timeout=20).close()
        return True
    if host := os.getenv("SMTP_HOST"):
        with smtplib.SMTP(
            host, int(os.getenv("SMTP_PORT", "587")), timeout=20
        ) as server:
            server.starttls()
            if user := os.getenv("SMTP_USER"):
                server.login(user, os.getenv("SMTP_PASSWORD", ""))
            server.send_message(mail)
        return True
    return False


class NotConfigured(Exception):
    """No mail service is set (RESEND_API_KEY or SMTP_HOST)."""


def send_test(funder: dict) -> str:
    """Sends right now the reminder of one funder, marked [TEST]; returns the address it went to."""
    if not configured():
        raise NotConfigured
    mail = message(
        funder, reminder_date(funder) or datetime.now(PARIS).date(), test=True
    )
    deliver(mail)
    return mail["To"]


def run(today: date | None = None, dry: bool = False) -> list[dict]:
    """Sends (or, when `dry`, only lists) the reminders due today; each one leaves once."""
    today = today or datetime.now(PARIS).date()
    funders = store.load_document("funders") or []
    sent = set(store.load_document(SENT_KEY) or [])
    report = []
    for funder, when in due(funders, today, sent):
        mail = message(funder, when)
        delivered = False
        if not dry and configured():
            try:
                delivered = deliver(mail)
            except (
                Exception
            ):  # a failed send is retried the next morning, within the lookback
                log.exception("Rappel non envoyé : %s", funder.get("name"))
        if delivered:
            sent.add(f"{funder.get('id')}:{when}")
        report.append(
            {
                "name": funder.get("name") or "",
                "reminder": str(when),
                "subject": mail["Subject"],
                "sent": delivered,
            }
        )
    if any(item["sent"] for item in report):
        store.save_document(SENT_KEY, sorted(sent))
    if report and not configured() and not dry:
        log.warning(
            "%d rappel(s) à envoyer, mais aucun service d'envoi n'est configuré (RESEND_API_KEY ou SMTP_HOST).",
            len(report),
        )
    return report


def loop() -> None:
    time.sleep(60)
    last = None
    while True:
        now = datetime.now(PARIS)
        if now.hour >= SEND_HOUR and last != now.date():
            last = now.date()
            try:
                run(now.date())
            except Exception:
                log.exception("Contrôle des rappels impossible")
        time.sleep(1800)


def start_daily() -> None:
    """Once a day, from 8:00 Paris time, on a server that stays on (not on Vercel's short-lived instances)."""
    if os.getenv("VERCEL") or os.getenv("REMINDERS", "on") == "off":
        return
    Thread(target=loop, daemon=True, name="funding-reminders").start()
