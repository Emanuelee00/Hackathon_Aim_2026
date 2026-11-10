"""The team's funding tracker to and from Excel; the funders are kept in the store."""

import logging
import os
from typing import Annotated
from zipfile import BadZipFile

from fastapi import (
    APIRouter,
    Body,
    Depends,
    HTTPException,
    Path,
    Request,
    Response,
    UploadFile,
)
from openpyxl.utils.exceptions import InvalidFileException
from pydantic import BaseModel, ConfigDict, Field

from accounts.models import User
from accounts.sessions import team_member

from .backup import copy_days, load_copy
from .excel import read_tracker
from .reminders import (
    NotConfigured,
    default_notify_email,
    notify_email,
    save_notify_email,
    send_test,
)
from .reminders import run as run_reminders
from .workbook import write_tracker

router = APIRouter(prefix="/api/funders")
Team = Annotated[User, Depends(team_member)]
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
Day = Annotated[str, Path(pattern=r"^\d{4}-\d{2}-\d{2}$")]


def excel_file(funders: list, name: str) -> Response:
    disposition = {"Content-Disposition": f'attachment; filename="{name}"'}
    return Response(write_tracker(funders), media_type=XLSX, headers=disposition)


@router.post("/import")
async def import_tracker(file: UploadFile, user: Team) -> dict[str, list]:
    """Reads the Excel file; the page then decides whether to replace its funders."""
    try:
        return {"funders": read_tracker(await file.read())}
    except KeyError as exc:
        raise HTTPException(422, "L’onglet « Retroplanning » est introuvable.") from exc
    except (BadZipFile, InvalidFileException, OSError) as exc:
        raise HTTPException(
            422, "Ce fichier n’est pas un Excel (.xlsx) lisible."
        ) from exc


@router.post("/export")
def export_tracker(funders: Annotated[list[dict], Body()], user: Team) -> Response:
    """The funders the page shows, so a change not saved yet is not missed."""
    return excel_file(funders, "AAP retroplanning - Chez Marthe.xlsx")


@router.get("/backups")
def list_backups(user: Team) -> dict[str, list[str]]:
    """The days with a copy kept on the server, most recent first."""
    return {"days": copy_days()}


@router.get("/backups/{day}")
def download_backup(day: Day, user: Team) -> Response:
    funders = load_copy(day)
    if funders is None:
        raise HTTPException(404, "Aucune copie ce jour-là.")
    return excel_file(funders, f"AAP retroplanning - {day}.xlsx")


@router.post("/reminders/run")
def reminders(user: Team, dry: bool = True) -> dict[str, list[dict]]:
    """The follow-up reminders due today; with `dry=false` they are also sent (once each)."""
    return {"reminders": run_reminders(dry=dry)}


@router.post("/reminders/test")
def test_reminder(funder: Annotated[dict, Body()], user: Team) -> dict:
    """Sends right now the follow-up e-mail of this funder to the team's address, to check that e-mails leave."""
    try:
        return {"sent": True, "to": send_test(funder)}
    except NotConfigured as exc:
        raise HTTPException(
            503,
            "Aucun service d’envoi n’est configuré : ajoutez RESEND_API_KEY (ou SMTP_HOST) dans les réglages du serveur.",
        ) from exc
    except Exception as exc:
        logging.getLogger("marthe.reminders").exception("E-mail de test non envoyé")
        raise HTTPException(
            502,
            "Le service d’envoi a refusé le message. Vérifiez la clé et l’adresse d’expédition.",
        ) from exc


@router.get("/reminders/cron")
def reminders_cron(request: Request) -> dict[str, list[dict]]:
    """Called every morning by Vercel Cron (it sends `Authorization: Bearer $CRON_SECRET`): sends the reminders due today."""
    secret = os.getenv("CRON_SECRET")
    if not secret or request.headers.get("authorization") != f"Bearer {secret}":
        raise HTTPException(401, "Accès refusé.")
    return {"reminders": run_reminders()}


class NotifyEmail(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: str = Field(
        default="", max_length=254, pattern=r"^([^@\s]+@[^@\s]+\.[^@\s]+)?$"
    )


def notify_settings() -> dict:
    return {"email": notify_email(), "default": default_notify_email()}


@router.get("/reminders/settings")
def read_notify_settings(user: Team) -> dict:
    """The address the reminder e-mails go to (editable on the funding page)."""
    return notify_settings()


@router.put("/reminders/settings")
def change_notify_settings(settings: NotifyEmail, user: Team) -> dict:
    """Changes the address; an empty one goes back to the default address."""
    save_notify_email(settings.email.strip().lower())
    return notify_settings()
