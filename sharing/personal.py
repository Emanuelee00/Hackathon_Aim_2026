"""A resident's own proposals and an association's own onboarding entry."""

from accounts.models import User

from .identity import association_id, resident_id

# The team's suggestions not sent yet, and the ones it dismissed, stay internal.
INTERNAL = {"suggested", "dismissed"}
# Answers a resident may give; "not_selected" is the team's and cannot be undone.
ANSWERS = {"proposed", "applied", "accepted", "declined"}
# Fields a resident sends with a proposal she found (open activity or CV).
FOUND_FIELDS = (
    "eventId",
    "source",
    "status",
    "rationale",
    "benefit",
    "vigilance",
    "reasons",
)


def resident_matches(matches: list[dict], user: User) -> list[dict]:
    mine = resident_id(user)
    return [
        m
        for m in matches
        if m.get("resident_id") == mine and m.get("status") not in INTERNAL
    ]


def merge_resident_matches(
    current: list[dict], incoming: list[dict], user: User
) -> list[dict]:
    """Only her answers change; journeys, notes and other residents stay the team's."""
    mine = resident_id(user)
    answers = {
        m.get("id"): m
        for m in incoming
        if m.get("resident_id") == mine and m.get("status") in ANSWERS
    }
    merged = []
    for match in current:
        answer = answers.pop(match.get("id"), None)
        if (
            answer
            and match.get("resident_id") == mine
            and match.get("status") != "not_selected"
        ):
            match = {**match, "status": answer["status"]}
        merged.append(match)
    for answer in answers.values():
        found = {field: answer[field] for field in FOUND_FIELDS if field in answer}
        if (
            isinstance(found.get("eventId"), str)
            and answer.get("id") == f"{found['eventId']}-{mine}"
        ):
            merged.append({**found, "id": answer["id"], "resident_id": mine})
    return merged


def own_partner(partners: list[dict], user: User) -> list[dict]:
    return [p for p in partners if p.get("id") == association_id(user)]


def merge_partner(current: list[dict], incoming: list[dict], user: User) -> list[dict]:
    own = association_id(user)
    entry = next((p for p in incoming if p.get("id") == own), None)
    if not own or not entry:
        return current
    return [p for p in current if p.get("id") != own] + [{**entry, "id": own}]
