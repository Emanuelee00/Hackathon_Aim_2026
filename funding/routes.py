"""The team's funding tracker to and from Excel; the funders are kept in the store."""

from typing import Annotated
from zipfile import BadZipFile

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Response, UploadFile
from openpyxl.utils.exceptions import InvalidFileException

from accounts.models import User
from accounts.sessions import team_member

from .backup import copy_days, load_copy
from .excel import read_tracker
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
