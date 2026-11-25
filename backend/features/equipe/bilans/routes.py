"""HTTP endpoints for monthly structure reports and annual Excel exports."""

from datetime import UTC, datetime
from typing import Annotated
from urllib.parse import quote

from core import store
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import Response

from features.accounts.models import User
from features.accounts.sessions import current_user, team_member

from .excel import workbook
from .schema import (
    BY_ID,
    KEY,
    MONTH,
    XLSX,
    clean_answers,
    entries,
    own_structure,
    public,
    visible,
)

router = APIRouter(prefix="/api/bilans")


@router.get("")
def read(user: Annotated[User, Depends(current_user)]) -> dict:
    """Les questions et les bilans que ce compte peut voir."""
    shown = visible(user)
    ids = {s["id"] for s in shown}
    return {
        "structures": [public(s) for s in shown],
        "entries": [e for e in entries() if e.get("structure") in ids],
        "mine": own_structure(user) if user.role == "partenaires" else None,
    }


@router.put("/{structure_id}/{month}")
def save(
    structure_id: str,
    month: str,
    user: Annotated[User, Depends(current_user)],
    answers: Annotated[dict, Body(embed=True)],
) -> dict:
    structure = BY_ID.get(structure_id)
    if not structure or structure not in visible(user):
        raise HTTPException(403, "Ce bilan n’est pas celui de votre structure.")
    if not MONTH.match(month):
        raise HTTPException(422, "Mois invalide.")
    entry = {
        "structure": structure_id,
        "month": month,
        "answers": clean_answers(structure, answers),
        "updatedAt": datetime.now(UTC).isoformat(timespec="seconds"),
        "by": user.name,
    }
    others = [
        e
        for e in entries()
        if (e.get("structure"), e.get("month")) != (structure_id, month)
    ]
    store.save_document(KEY, [*others, entry])  # type: ignore[arg-type]
    return entry


@router.get("/excel")
def export(
    _: Annotated[User, Depends(team_member)],
    annee: Annotated[int, Query(ge=2020, le=2039)],
) -> Response:
    name = quote(f"Bilans des structures {annee} - Chez Marthe.xlsx")
    saved = [e for e in entries() if str(e.get("month", "")).startswith(f"{annee}-")]
    return Response(
        workbook(annee, saved),
        media_type=XLSX,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{name}"},
    )
