"""Events for the signed-in spaces other than the team's."""

from uuid import uuid4

from accounts.models import User

from .identity import same_person
from .models import EventDraft

# What the resident, volunteer and partner pages use: no contacts, money or notes.
SHARED_FIELDS = (
    "id",
    "title",
    "category",
    "date",
    "start",
    "end",
    "space",
    "status",
    "description",
    "opportunity",
    "participants",
    "requestType",
    "referent",
    "volunteerNeeds",
)


def shared_view(events: list[dict], user: User) -> list[dict]:
    """Other volunteers stay anonymous: their sign-ups still count, without names."""
    return [
        {
            **{field: event[field] for field in SHARED_FIELDS if field in event},
            "tasks": [],
            "volunteers": [
                v if same_person(v.get("name", ""), user) else {**v, "name": ""}
                for v in event.get("volunteers", [])
            ],
        }
        for event in events
    ]


def merge_signups(current: list[dict], incoming: list[dict], user: User) -> list[dict]:
    """A volunteer only adds or removes their own sign-ups, within the places left."""
    wanted = {event.get("id"): event.get("volunteers", []) for event in incoming}
    merged = []
    for event in current:
        volunteers = event.get("volunteers", [])
        others = [v for v in volunteers if not same_person(v.get("name", ""), user)]
        mine = [
            v
            for v in wanted.get(event["id"], volunteers)
            if same_person(str(v.get("name", "")), user)
        ]
        for need in event.get("volunteerNeeds", []):
            taken = sum(v.get("needId") == need["id"] for v in others)
            signup = next((v for v in mine if v.get("needId") == need["id"]), None)
            if signup and taken < need.get("needed", 0):
                signup_id = str(signup.get("id") or uuid4())[:64]
                others.append(
                    {"id": signup_id, "needId": need["id"], "name": user.name}
                )
        merged.append(
            {**event, "volunteers": others}
            if "volunteers" in event or others
            else event
        )
    return merged


def merge_bookings(current: list[dict], incoming: list[dict], user: User) -> list[dict]:
    """An association may only add pending bookings, always in its own name."""
    known = {event.get("id") for event in current}
    added = []
    for event in incoming:
        if event.get("id") in known or not isinstance(event.get("id"), str):
            continue
        draft = EventDraft.model_validate(event)
        added.append(
            draft.as_event(
                event["id"][:80],
                organizer=user.name,
                source="Espace associations",
                requestType="rental",
                category="Association hébergée",
                referentTeam=user.name,
            )
        )
        known.add(event["id"])
    return current + added
