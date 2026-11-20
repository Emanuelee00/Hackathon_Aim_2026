"""Resident assistant: only her own proposals and journey, plus activities open to all."""

from sharing.identity import resident_id

from .data import PUBLIC_FIELDS, as_text, pick, stored, upcoming
from .handoff import account_hand_off
from .llm import Agent, Context, Tool, params
from .prompts import instructions

# The team's suggestions not sent yet and the ones it dismissed stay internal.
STATUSES = {
    "proposed": "Proposée, en attente de sa réponse",
    "applied": "Candidature envoyée, en attente de l’équipe",
    "accepted": "Elle participe",
    "declined": "Elle a refusé",
    "not_selected": "Candidature non retenue",
}


def my_activities(arguments: dict, context: Context) -> str:
    # Same link as the resident page and the store: demo profile by e-mail, or the account.
    mine_id = resident_id(context.user)
    events = {event["id"]: event for event in stored("events")}
    mine = [
        {
            "statut": STATUSES[m["status"]],
            **pick(events[m["eventId"]], PUBLIC_FIELDS),
            **pick(m, ("rationale", "benefit")),
        }
        for m in stored("matches")
        if m.get("resident_id") == mine_id
        and m.get("status") in STATUSES
        and m.get("eventId") in events
    ]
    return as_text(mine)


def open_activities(arguments: dict, context: Context) -> str:
    events = [e for e in upcoming(stored("events")) if e.get("opportunity")]
    return as_text([pick(event, (*PUBLIC_FIELDS, "opportunity")) for event in events])


AGENT = Agent(
    id="residents",
    audience="residents",
    instructions=instructions(
        "Tu es l’assistante de l’espace résidentes de Chez Marthe. Tu parles à une "
        "résidente : vouvoie-la, sois douce et simple, rappelle que rien n’est "
        "obligatoire. Tu l’aides à comprendre ses propositions, son parcours et les "
        "activités ouvertes. Pour accepter ou candidater, oriente vers l’onglet "
        "« Propositions ». Si elle parle de danger, de violence ou d’urgence, donne "
        "tout de suite le 17 ou le 112 (urgence) et le 3919 (Violences Femmes Info, "
        "gratuit, anonyme), puis propose de prévenir l’équipe."
    ),
    tools=(
        Tool(
            "mes_activites",
            "Ses propositions, candidatures et activités.",
            params(),
            my_activities,
        ),
        Tool(
            "activites_ouvertes",
            "Activités à venir ouvertes aux résidentes.",
            params(),
            open_activities,
        ),
        account_hand_off("residents"),
    ),
)
