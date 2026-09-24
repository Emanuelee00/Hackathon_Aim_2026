"""The two public forms: a request from the landing page, a bilan after an event.

They never read the shared documents: each only adds one thing to them.
"""

import re
from datetime import datetime
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException

import store

from .models import EventDraft, Feedback

router = APIRouter(prefix="/api")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def feedback_events(events: list[dict]) -> list[dict]:
    """Same rule as the bilan page: confirmed or done, and already held."""
    today = datetime.now(ZoneInfo("Europe/Paris")).date().isoformat()
    return [
        e
        for e in events
        if e.get("status") in ("confirmed", "completed") and e.get("date", "") <= today
    ]


@router.post("/requests", status_code=201)
def submit_request(draft: EventDraft) -> dict[str, str]:
    if not (draft.organizer and EMAIL.match(draft.email)):
        raise HTTPException(422, "Indiquez votre nom et une adresse e-mail valide.")
    event = draft.as_event(f"request-{uuid4().hex[:12]}", source="Formulaire en ligne")
    store.save_document("events", [*(store.load_document("events") or []), event])
    return {"id": event["id"]}


@router.get("/feedback/events")
def list_feedback_events() -> list[dict]:
    """Only what the bilan page shows: no contacts, money or other answers."""
    return [
        {
            **{f: e.get(f) for f in ("id", "title", "date", "space", "status")},
            "organizerFeedback": bool(e.get("organizerFeedback")),
        }
        for e in sorted(
            feedback_events(store.load_document("events") or []),
            key=lambda e: e["date"],
            reverse=True,
        )
    ]


@router.post("/feedback/{event_id}", status_code=201)
def submit_feedback(event_id: str, feedback: Feedback) -> dict[str, str]:
    events = store.load_document("events") or []
    event = next((e for e in feedback_events(events) if e.get("id") == event_id), None)
    if not event:
        raise HTTPException(404, "Événement introuvable.")
    if event.get("organizerFeedback"):
        raise HTTPException(409, "Le bilan de cet événement est déjà enregistré.")
    recorded = {
        **feedback.model_dump(),
        "recordedAt": datetime.now(ZoneInfo("Europe/Paris")).isoformat(),
    }
    store.save_document(
        "events",
        [{**e, "organizerFeedback": recorded} if e is event else e for e in events],
    )
    return {"status": "ok"}
