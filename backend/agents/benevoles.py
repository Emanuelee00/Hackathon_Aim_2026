"""Volunteer assistant: open missions (without names) and the volunteer's own sign-ups."""

from .data import as_text, pick, same_name, stored, upcoming
from .handoff import account_hand_off
from .llm import Agent, Context, Tool, params
from .prompts import instructions

MISSION_FIELDS = ("title", "date", "start", "end", "space", "status")


def missions(arguments: dict, context: Context) -> str:
    found = []
    for event in upcoming(stored("events")):
        taken = [volunteer.get("needId") for volunteer in event.get("volunteers", [])]
        roles = [
            {
                "role": need.get("role"),
                "places_libres": need.get("needed", 0) - taken.count(need.get("id")),
            }
            for need in event.get("volunteerNeeds", [])
        ]
        if roles:
            found.append({**pick(event, MISSION_FIELDS), "roles": roles})
    return as_text(found)


def my_signups(arguments: dict, context: Context) -> str:
    # Sign-ups are recorded under the account's name, as on the volunteer page.
    mine = []
    for event in stored("events"):
        needs = {
            need.get("id"): need.get("role") for need in event.get("volunteerNeeds", [])
        }
        mine += [
            {**pick(event, MISSION_FIELDS), "role": needs.get(volunteer.get("needId"))}
            for volunteer in event.get("volunteers", [])
            if same_name(str(volunteer.get("name", "")), context.user.name)
        ]
    return as_text(mine)


AGENT = Agent(
    id="benevoles",
    audience="benevoles",
    instructions=instructions(
        "Tu es l’assistant de l’espace bénévoles de Chez Marthe. Tu aides une ou un "
        "bénévole à trouver une mission qui lui convient et à retrouver ses "
        "inscriptions. Pour s’inscrire ou se désinscrire, oriente vers les boutons "
        "de la page des missions."
    ),
    tools=(
        Tool(
            "missions",
            "Missions à venir et places libres par rôle.",
            params(),
            missions,
        ),
        Tool(
            "mes_inscriptions",
            "Les missions où cette personne est inscrite.",
            params(),
            my_signups,
        ),
        account_hand_off("benevoles"),
    ),
)
