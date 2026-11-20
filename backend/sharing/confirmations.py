"""Confirmation e-mails for the public forms: once a request or a message is saved, the person who gave an e-mail address gets a short
message saying it arrived, with what they wrote. Sent after the answer, so a mail problem never fails the form; without a mail
service nothing is sent. The same address gets at most 3 a day, and 40 an hour in all, so a form cannot be used to write to strangers."""

import logging
import os
import time
from collections import defaultdict, deque
from datetime import date
from email.message import EmailMessage

import mailer
import messages

log = logging.getLogger("marthe.confirmations")
PER_ADDRESS_PER_DAY = 3
PER_HOUR = 40
DAY, HOUR = 86_400, 3_600
_by_address: dict[str, deque] = defaultdict(deque)
_all: deque = deque()

SPACE_NAMES = {
    "atelier": "L’Atelier",
    "salon": "Le Grand Salon",
    "cuisine": "La Cuisine",
    "chapelle": "La Chapelle",
    "jardin": "Le Jardin",
    "salon-collectif": "Le Salon collectif",
    "cantines": "Les Petites Cantines",
    "reunion": "La Salle de réunion",
    "coworking": "Le Coworking",
    "nice-studio": "Le Studio",
    "nice-verriere": "La Verrière",
    "nice-terrasse": "La Terrasse",
}
DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MONTHS = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
]


def contact_address() -> str:
    return os.getenv("CONTACT_EMAIL", "contact@chezmarthe.org")


def allowed(address: str, now: float | None = None) -> bool:
    """Counts a confirmation to `address`, or refuses it when the limits are reached."""
    now = time.time() if now is None else now
    recent = _by_address[address.lower()]
    while recent and now - recent[0] > DAY:
        recent.popleft()
    while _all and now - _all[0] > HOUR:
        _all.popleft()
    if len(recent) >= PER_ADDRESS_PER_DAY or len(_all) >= PER_HOUR:
        return False
    recent.append(now)
    _all.append(now)
    return True


def french_date(day: str) -> str:
    when = date.fromisoformat(day)
    return f"{DAYS[when.weekday()]} {when.day} {MONTHS[when.month - 1]} {when.year}"


def _mail(to: str, subject: str, body: str) -> EmailMessage:
    mail = EmailMessage()
    mail["Subject"] = subject
    mail["From"] = messages.forms_from()
    mail["To"] = to
    mail["Reply-To"] = (
        messages.forms_address()
    )  # a reply reaches the « Bonjour Chez Marthe » inbox
    mail.set_content(body)
    return mail


def request_message(draft) -> EmailMessage:
    """Request for an activity or a space (the landing page's form), written from the team's text (« Messages » page)."""
    kind = (
        "programmation d’une activité"
        if draft.requestType == "programming"
        else "location d’un espace"
    )
    when = french_date(draft.date)
    recap = [
        f"• Projet : {draft.title}",
        f"• Type de demande : {kind}",
        f"• Espace : {SPACE_NAMES.get(draft.space, draft.space)}",
        f"• Date : {when}, de {draft.start} à {draft.end}",
    ]
    if draft.participants:
        recap.append(f"• Nombre de personnes : {draft.participants}")
    values = {
        "nom": draft.organizer,
        "projet": draft.title,
        "type": kind,
        "espace": SPACE_NAMES.get(draft.space, draft.space),
        "date": when,
        "heure_debut": draft.start,
        "heure_fin": draft.end,
        "participants": str(draft.participants or ""),
        "recapitulatif": "\n".join(recap),
        "contact": messages.forms_address(),
    }
    subject, body = messages.current("request")
    return _mail(
        draft.email, messages.render(subject, values), messages.render(body, values)
    )


def contact_message(message) -> EmailMessage:
    """Message from the contact page, written from the team's text (« Messages » page)."""
    text = (
        message.message
        if len(message.message) <= 600
        else message.message[:600].rstrip() + "…"
    )
    values = {
        "nom": message.name,
        "sujet": message.subject,
        "message": text,
        "contact": contact_address(),
    }
    subject, body = messages.current("contact")
    return _mail(
        message.email, messages.render(subject, values), messages.render(body, values)
    )


def send_confirmation(mail: EmailMessage) -> None:
    """Background task: sends the confirmation when a mail service is set and the limits allow it; never raises."""
    if not mailer.configured():
        return
    if not allowed(mail["To"]):
        log.warning("Confirmation non envoyée (limite atteinte) : %s", mail["To"])
        return
    try:
        mailer.deliver(mail)
    except Exception:
        log.exception("Confirmation non envoyée : %s", mail["To"])
