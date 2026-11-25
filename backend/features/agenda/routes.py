"""The association's Google Agenda: the public week (home page) and the team calendar."""

from datetime import date, datetime, timedelta
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException

from features.accounts.models import User
from features.accounts.sessions import team_member

from . import gcal

router = APIRouter(prefix="/api")
PARIS = ZoneInfo("Europe/Paris")


@router.get("/programmation")
def programmation(semaine: str = "") -> dict:
    """Évènements du Google Agenda de l'association pour la semaine qui contient `semaine` (AAAA-MM-JJ, défaut : aujourd'hui)."""
    try:
        day = date.fromisoformat(semaine) if semaine else datetime.now(PARIS).date()
    except ValueError:
        raise HTTPException(
            status_code=422, detail="Date invalide : AAAA-MM-JJ attendu"
        ) from None
    monday = day - timedelta(days=day.weekday())
    return {"monday": monday.isoformat(), "events": gcal.week_public(monday)}


@router.get("/agenda")
def agenda(du: str, au: str, _: Annotated[User, Depends(team_member)]) -> dict:
    """Agendas Google de l'association pour le calendrier de l'équipe (connexion équipe requise)."""
    try:
        first, last = date.fromisoformat(du), date.fromisoformat(au)
    except ValueError:
        raise HTTPException(
            status_code=422, detail="Dates invalides : AAAA-MM-JJ attendu"
        ) from None
    if not first <= last <= first + timedelta(days=62):
        raise HTTPException(status_code=422, detail="Période de 62 jours maximum")
    return gcal.team_range(first, last)
