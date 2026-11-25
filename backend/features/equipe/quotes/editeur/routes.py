"""HTTP endpoints for Word and PDF document downloads."""

from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from features.accounts.models import User
from features.accounts.sessions import team_member
from features.equipe.quotes.facturation import FORMATS

from .docx import make_docx
from .models import Page
from .pdf import make_pdf

router = APIRouter(prefix="/api/editeur")
Team = Annotated[User, Depends(team_member)]


@router.post("/{extension}")
def download(extension: str, page: Page, user: Team) -> Response:
    """The document written in the editor, as a Word or PDF file."""
    if extension not in FORMATS:
        raise HTTPException(404, "Format introuvable.")
    content = make_docx(page) if extension == "docx" else make_pdf(page)
    name = (page.title.strip() or "Document").replace("/", "-")
    return Response(
        content,
        media_type=FORMATS[extension],
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(name)}.{extension}"
        },
    )
