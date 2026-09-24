"""Association assistant: its own bookings, and when spaces are taken (without details)."""

from datetime import datetime, timedelta

from .data import PARIS, PUBLIC_FIELDS, as_text, pick, same_name, stored, upcoming
from .handoff import account_hand_off
from .llm import Agent, Context, Tool, params
from .prompts import instructions


def my_bookings(arguments: dict, context: Context) -> str:
    # An association account is named after its association, as on the partner page.
    mine = [
        pick(event, (*PUBLIC_FIELDS, "participants"))
        for event in stored("events")
        if same_name(str(event.get("organizer", "")), context.user.name)
    ]
    return as_text(mine)


def occupancy(arguments: dict, context: Context) -> str:
    start = arguments.get("debut") or datetime.now(PARIS).date().isoformat()
    end = (
        arguments.get("fin")
        or (datetime.now(PARIS).date() + timedelta(days=14)).isoformat()
    )
    events = [e for e in upcoming(stored("events")) if start <= e["date"] <= end]
    # Other organisers' events: only when and where, never what or who.
    return as_text([pick(event, ("space", "date", "start", "end")) for event in events])


AGENT = Agent(
    id="partenaires",
    audience="partenaires",
    instructions=instructions(
        "Tu es l’assistant de l’espace associations de Chez Marthe. Tu parles à une "
        "association hébergée ou partenaire : aide-la à suivre ses réservations, à "
        "voir quand les espaces sont déjà pris et à préparer une nouvelle demande. "
        "Les créneaux occupés par d’autres ne disent ni qui ni quoi : ne devine pas. "
        "Pour réserver, oriente vers le formulaire de réservation de l’espace."
    ),
    tools=(
        Tool(
            "mes_reservations",
            "Les demandes et événements de cette association.",
            params(),
            my_bookings,
        ),
        Tool(
            "occupation_espaces",
            "Créneaux déjà pris entre deux dates (AAAA-MM-JJ), sans détail.",
            params(debut={"type": "string"}, fin={"type": "string"}),
            occupancy,
        ),
        account_hand_off("partenaires"),
    ),
)
