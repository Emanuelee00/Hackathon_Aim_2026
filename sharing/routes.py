"""The shared documents, as each signed-in role may see and change them."""

from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import ValidationError

import store
from accounts.models import User
from accounts.sessions import current_user

from .events import merge_bookings, merge_signups, shared_view
from .personal import (
    merge_partner,
    merge_resident_matches,
    own_partner,
    resident_matches,
)

router = APIRouter(prefix="/api")
Account = Annotated[User, Depends(current_user)]
# Besides the team, who may change what: each rule keeps only that person's changes.
WRITERS = {
    ("events", "benevoles"): merge_signups,
    ("events", "partenaires"): merge_bookings,
    ("matches", "residents"): merge_resident_matches,
    ("partners", "partenaires"): merge_partner,
}


def view(key: str, value: list, user: User) -> list:
    """The team sees everything; the other spaces only what their pages need."""
    if user.role == "equipe":
        return value
    if key == "events":
        return shared_view(value, user)
    if key == "matches" and user.role == "residents":
        return resident_matches(value, user)
    if key == "partners" and user.role == "partenaires":
        return own_partner(value, user)
    return []


@router.get("/store/{key}")
def read_document(key: store.Key, user: Account) -> dict[str, Any]:
    value = store.load_document(key)
    # Only the team seeds a missing document with the demo data.
    if value is None and user.role == "equipe":
        raise HTTPException(404, "Aucune donnée enregistrée.")
    return {"value": view(key, value or [], user)}


@router.put("/store/{key}")
def write_document(
    key: store.Key, value: Annotated[list[Any], Body()], user: Account
) -> dict[str, str]:
    if user.role == "equipe":
        store.save_document(key, value)
        return {"status": "ok"}
    merge = WRITERS.get((key, user.role))
    if not merge:
        raise HTTPException(403, "Cet espace ne peut pas modifier ces données.")
    if not all(isinstance(item, dict) for item in value):
        raise HTTPException(422, "Données invalides.")
    try:
        store.save_document(key, merge(store.load_document(key) or [], value, user))
    except ValidationError as exc:
        raise HTTPException(422, "Données invalides.") from exc
    return {"status": "ok"}
