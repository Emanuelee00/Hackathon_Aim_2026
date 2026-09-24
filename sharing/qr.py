"""QR codes the team shows at the end of an event, e.g. for the bilan link."""

import io
from typing import Annotated

import segno
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from accounts.models import User
from accounts.sessions import team_member

router = APIRouter(prefix="/api")


@router.get("/qr.svg")
def qr_code(
    text: Annotated[str, Query(min_length=1, max_length=500)],
    _: Annotated[User, Depends(team_member)],
) -> Response:
    """White background, so it scans on a dark screen and prints as is."""
    svg = io.BytesIO()
    segno.make(text, error="m").save(svg, kind="svg", scale=8, border=2, light="#fff")
    return Response(svg.getvalue(), media_type="image/svg+xml")
