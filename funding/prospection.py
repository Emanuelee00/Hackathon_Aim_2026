"""« Financeurs potentiels »: the team's prospection workbook (the funders to approach, the calls and their deadlines, the funding
strategy) and the European and French calls, edited on the site as tables kept in the store ("prospects", "prospectCalls",
"fundingStrategy", "euCalls", "frCalls", team only).
Here: the same tables written back as an Excel file, one sheet per table, like the team's original Google Sheets file.
"""

from io import BytesIO
from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from pydantic import BaseModel, Field

from accounts.models import User
from accounts.sessions import team_member

router = APIRouter(prefix="/api/prospection")
Team = Annotated[User, Depends(team_member)]
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
Cell = Annotated[str, Field(max_length=5000)]


class Sheet(BaseModel):
    title: str = Field(min_length=1, max_length=31)
    columns: list[Cell] = Field(min_length=1, max_length=40)
    rows: list[list[Cell]] = Field(max_length=2000)


class Sheets(BaseModel):
    sheets: list[Sheet] = Field(min_length=1, max_length=10)


HEAD = PatternFill("solid", fgColor="E7DCEE")


def workbook(sheets: list[Sheet]) -> bytes:
    book = Workbook()
    book.remove(book.active)
    for sheet in sheets:
        page = book.create_sheet(sheet.title.replace("/", "-"))
        page.append(sheet.columns)
        for row in sheet.rows:
            page.append(row[: len(sheet.columns)])
        for cell in page[1]:
            cell.font = Font(bold=True)
            cell.fill = HEAD
        for column in page.iter_cols(min_row=2):
            for cell in column:
                cell.alignment = Alignment(wrap_text=True, vertical="top")
        for index, label in enumerate(sheet.columns, start=1):
            longest = max(
                [
                    len(label),
                    *(len(row[index - 1]) for row in sheet.rows if len(row) >= index),
                ]
            )
            page.column_dimensions[get_column_letter(index)].width = min(
                60, max(12, longest * 0.6)
            )
        page.freeze_panes = "B2"
    output = BytesIO()
    book.save(output)
    return output.getvalue()


@router.post("/excel")
def export(body: Sheets, user: Team) -> Response:
    """The tables as the page shows them, as an Excel file to download."""
    name = quote("Financeurs potentiels - Chez Marthe.xlsx")
    return Response(
        workbook(body.sheets),
        media_type=XLSX,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{name}"},
    )
