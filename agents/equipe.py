"""Team assistant: reads the whole request queue, calendar, questions and journeys."""

from datetime import datetime, timedelta

from sqlalchemy import select

from .data import PARIS, PUBLIC_FIELDS, as_text, pick, stored, upcoming
from .llm import Agent, Context, Tool, params
from .models import Question
from .prompts import instructions

TEAM_FIELDS = (
    *PUBLIC_FIELDS,
    "id",
    "organizer",
    "email",
    "participants",
    "requestType",
    "referent",
    "opportunity",
    "revenue",
    "costs",
)
STATUSES = [
    "all",
    "pending",
    "incomplete",
    "waitlisted",
    "confirmed",
    "completed",
    "cancelled",
]


def search_requests(arguments: dict, context: Context) -> str:
    status = arguments.get("statut") or "all"
    text = str(arguments.get("texte") or "").casefold()
    found = [
        pick(event, TEAM_FIELDS)
        for event in stored("events")
        if status in ("all", event.get("status"))
        and text
        in f"{event.get('title')} {event.get('organizer')} {event.get('category')}".casefold()
    ]
    return as_text(found[:25])


def calendar(arguments: dict, context: Context) -> str:
    start = arguments.get("debut") or datetime.now(PARIS).date().isoformat()
    end = (
        arguments.get("fin")
        or (datetime.now(PARIS).date() + timedelta(days=30)).isoformat()
    )
    events = [e for e in upcoming(stored("events")) if start <= e["date"] <= end]
    return as_text([pick(event, TEAM_FIELDS) for event in events])


def team_questions(arguments: dict, context: Context) -> str:
    status = arguments.get("statut") or "new"
    query = select(Question).order_by(Question.id.desc()).limit(25)
    if status != "all":
        query = query.where(Question.status == status)
    fields = ("id", "agent", "name", "email", "summary", "status")
    return as_text(
        [{f: getattr(q, f) for f in fields} for q in context.db.scalars(query)]
    )


def journeys(arguments: dict, context: Context) -> str:
    events = {event["id"]: event for event in stored("events")}
    wanted = str(arguments.get("residente") or "").casefold()
    found = [
        {
            "residente": m.get("resident_id"),
            "activite": events[m["eventId"]].get("title"),
            "statut": m.get("status"),
            "source": m.get("source"),
        }
        for m in stored("matches")
        if m.get("eventId") in events and wanted in str(m.get("resident_id")).casefold()
    ]
    return as_text(found[:40])


TOOLS = (
    Tool(
        "rechercher_demandes",
        "Demandes d’occupation (tous statuts), avec contacts et budget.",
        params(
            statut={"type": "string", "enum": STATUSES},
            texte={
                "type": "string",
                "description": "Titre, organisateur ou catégorie.",
            },
        ),
        search_requests,
    ),
    Tool(
        "calendrier",
        "Événements à venir, en attente ou confirmés, entre deux dates (AAAA-MM-JJ).",
        params(debut={"type": "string"}, fin={"type": "string"}),
        calendar,
    ),
    Tool(
        "questions_recues",
        "Questions transmises à l’équipe par les assistants.",
        params(statut={"type": "string", "enum": ["new", "done", "all"]}),
        team_questions,
    ),
    Tool(
        "parcours_residentes",
        "Propositions et parcours des résidentes consentantes.",
        params(residente={"type": "string", "description": "Identifiant ou prénom."}),
        journeys,
    ),
)

AGENT = Agent(
    id="equipe",
    audience="equipe",
    instructions=instructions(
        "Tu es l’assistant de l’équipe de coordination de Chez Marthe. Tu aides à "
        "retrouver une demande, préparer le comité du vendredi, repérer les questions "
        "en attente et suivre les parcours. Cite les références et les dates exactes."
    ),
    tools=TOOLS,
)
