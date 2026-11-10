"""The automatic e-mails, as texts the team can edit on the « Messages » page: the confirmation sent after a form, the funding reminder.

Each text has variables written between braces ({nom}, {financeur}…) that are replaced when the e-mail is sent. A text the team
has saved replaces the original one; resetting goes back to the original. Saved texts live in the store (document "message_templates").
"""

import os
import re
from dataclasses import dataclass
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

import store
from accounts.models import User
from accounts.sessions import team_member

STORE_KEY = "message_templates"
VARIABLE = re.compile(r"\{(\w+)\}")
router = APIRouter(prefix="/api/messages")
Team = Annotated[User, Depends(team_member)]


def contact_address() -> str:
    return os.getenv("CONTACT_EMAIL", "contact@chezmarthe.org")


@dataclass(frozen=True)
class Template:
    id: str
    group: str
    title: str
    trigger: str  # when it is sent
    recipient: str  # who gets it
    subject: str
    body: str
    variables: tuple[tuple[str, str, str], ...]  # (name, what it is, example)


FOOTER = """Une question ? Écrivez-nous à {contact}.

Si vous n’êtes pas à l’origine de cette démarche, vous pouvez ignorer ce message.
— Chez Marthe, un réseau de lieux tremplins pour les femmes"""

TEMPLATES: tuple[Template, ...] = (
    Template(
        id="request",
        group="Bonjour Chez Marthe",
        title="Réponse automatique à une demande d’activité ou de location",
        trigger="Envoyée tout de suite après le formulaire de demande d’activité ou d’espace, si la personne a donné son e-mail.",
        recipient="La personne qui a rempli le formulaire",
        subject="Chez Marthe : nous avons bien reçu votre demande",
        body=(
            "Bonjour {nom},\n\n"
            "Merci ! Nous avons bien reçu votre demande et tout est bien enregistré. Voici ce que nous avons noté :\n\n"
            "{recapitulatif}\n\n"
            "L’équipe étudie votre demande et vous répond rapidement à cette adresse. Ce message confirme seulement la bonne réception : "
            "la demande n’est pas encore acceptée.\n\n" + FOOTER
        ),
        variables=(
            ("nom", "Nom de la personne", "Awa"),
            ("projet", "Nom du projet", "Atelier danse"),
            ("type", "Type de demande", "programmation d’une activité"),
            ("espace", "Espace demandé", "La Chapelle"),
            ("date", "Date demandée", "samedi 12 décembre 2026"),
            ("heure_debut", "Heure de début", "18:00"),
            ("heure_fin", "Heure de fin", "20:00"),
            ("participants", "Nombre de personnes", "25"),
            (
                "recapitulatif",
                "Récapitulatif complet (projet, type, espace, date, personnes)",
                (
                    "• Projet : Atelier danse\n• Type de demande : programmation d’une activité\n• Espace : La Chapelle\n"
                    "• Date : samedi 12 décembre 2026, de 18:00 à 20:00\n• Nombre de personnes : 25"
                ),
            ),
            ("contact", "Adresse de contact de Chez Marthe", "contact@chezmarthe.org"),
        ),
    ),
    Template(
        id="contact",
        group="Bonjour Chez Marthe",
        title="Réponse automatique à un message de contact",
        trigger="Envoyée tout de suite après le formulaire de la page Contact, si la personne a donné son e-mail.",
        recipient="La personne qui a écrit",
        subject="Chez Marthe : nous avons bien reçu votre message",
        body=(
            "Bonjour {nom},\n\n"
            "Merci ! Nous avons bien reçu votre message. Voici ce que vous nous avez écrit :\n\n"
            "Sujet : {sujet}\n{message}\n\n"
            "Nous vous répondons dès que possible à cette adresse.\n\n" + FOOTER
        ),
        variables=(
            ("nom", "Nom de la personne", "Awa"),
            ("sujet", "Sujet du message", "Visite du lieu"),
            ("message", "Son message", "Peut-on visiter le lieu ?"),
            ("contact", "Adresse de contact de Chez Marthe", "contact@chezmarthe.org"),
        ),
    ),
    Template(
        id="funding-reminder",
        group="Financements",
        title="Rappel pour recontacter un financeur",
        trigger="Envoyé chaque matin, à la date de relance d’un financement (11 mois après l’obtention par défaut).",
        recipient="L’adresse choisie sur la page Financements",
        subject="Rappel : recontacter {financeur} pour un nouveau financement",
        body=(
            "Bonjour,\n\n"
            "Rappel automatique : le financement de « {financeur} » a été obtenu le {date_obtention}, il y a {mois} mois.\n"
            "C’est le moment de les recontacter pour demander un nouveau financement.\n\n"
            "{recapitulatif}\n\n"
            "Contact Chez Marthe : {contact}\n\n"
            "— Intranet financements, Chez Marthe"
        ),
        variables=(
            ("financeur", "Nom du financeur", "Fondation de France"),
            ("date_obtention", "Date d’obtention du financement", "10/01/2026"),
            ("mois", "Mois depuis l’obtention", "11"),
            ("montant", "Aide obtenue", "30 000 €"),
            ("contact_financeur", "Nom du contact chez le financeur", "Mme Durand"),
            ("courriel_financeur", "E-mail du contact", "durand@fdf.example"),
            ("telephone", "Téléphone du contact", "01 23 45 67 89"),
            ("responsable", "Responsable du dossier", "Caro"),
            (
                "recapitulatif",
                "Récapitulatif complet (financeur, aide, contact, e-mail, téléphone, responsable)",
                (
                    "Financeur : Fondation de France (Fondation)\nAide obtenue : 30 000 €\nContact : Mme Durand\n"
                    "Courriel : durand@fdf.example\nTéléphone : 01 23 45 67 89\nResponsable : Caro"
                ),
            ),
            ("contact", "Adresse de contact de Chez Marthe", "contact@chezmarthe.org"),
        ),
    ),
)
BY_ID = {template.id: template for template in TEMPLATES}


def render(text: str, values: dict[str, str]) -> str:
    """Replaces {name} by its value; a name that is not known is left as written."""
    return VARIABLE.sub(lambda m: str(values[m[1]]) if m[1] in values else m[0], text)


def saved() -> dict[str, dict]:
    return {item["id"]: item for item in (store.load_document(STORE_KEY) or [])}


def current(template_id: str) -> tuple[str, str]:
    """(subject, body) to use: the team's saved text, else the original."""
    template = BY_ID[template_id]
    mine = saved().get(template_id)
    if mine:
        return mine["subject"], mine["body"]
    return template.subject, template.body


def samples(template: Template) -> dict[str, str]:
    return {name: example for name, _, example in template.variables}


def describe(template: Template) -> dict:
    subject, body = current(template.id)
    values = samples(template)
    return {
        "id": template.id,
        "group": template.group,
        "title": template.title,
        "trigger": template.trigger,
        "recipient": template.recipient,
        "subject": subject,
        "body": body,
        "defaultSubject": template.subject,
        "defaultBody": template.body,
        "custom": template.id in saved(),
        "variables": [
            {"name": n, "label": label, "example": e}
            for n, label, e in template.variables
        ],
        "preview": {"subject": render(subject, values), "body": render(body, values)},
    }


class Draft(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    subject: str = Field(min_length=1, max_length=150, pattern=r"^[^\r\n]+$")
    body: str = Field(min_length=1, max_length=4000)


def check_variables(template: Template, *texts: str) -> None:
    known = {name for name, _, _ in template.variables}
    unknown = sorted(
        {name for text in texts for name in VARIABLE.findall(text)} - known
    )
    if unknown:
        listed = ", ".join("{" + name + "}" for name in unknown)
        raise HTTPException(
            422,
            f"Variable inconnue : {listed}. Utilisez seulement celles proposées sous le message.",
        )


def find(template_id: str) -> Template:
    if template_id not in BY_ID:
        raise HTTPException(404, "Message introuvable.")
    return BY_ID[template_id]


def sender() -> dict:
    mailing = bool(os.getenv("RESEND_API_KEY") or os.getenv("SMTP_HOST"))
    return {
        "from": os.getenv("MAIL_FROM", f"Chez Marthe <{contact_address()}>"),
        "replyTo": contact_address(),
        "configured": mailing,
    }


@router.get("")
def list_messages(user: Team) -> dict:
    return {
        "sender": sender(),
        "templates": [describe(template) for template in TEMPLATES],
    }


@router.put("/{template_id}")
def save_message(template_id: str, draft: Draft, user: Team) -> dict:
    template = find(template_id)
    check_variables(template, draft.subject, draft.body)
    others = [
        item
        for item in (store.load_document(STORE_KEY) or [])
        if item["id"] != template_id
    ]
    store.save_document(
        STORE_KEY,
        [*others, {"id": template_id, "subject": draft.subject, "body": draft.body}],
    )
    return describe(template)


@router.delete("/{template_id}")
def reset_message(template_id: str, user: Team) -> dict:
    template = find(template_id)
    others = [
        item
        for item in (store.load_document(STORE_KEY) or [])
        if item["id"] != template_id
    ]
    store.save_document(STORE_KEY, others)
    return describe(template)
