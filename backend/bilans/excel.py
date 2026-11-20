"""Excel workbook builder for annual structure reports."""

from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

from .schema import COMMON, MONTHS, STRUCTURES, sections


def workbook(year: int, saved: list[dict]) -> bytes:
    """Une feuille « Indicateurs communs » (l'année, par structure) puis une feuille par structure (une colonne par mois)."""
    book = Workbook()
    head = Font(bold=True, color="FFFFFF")
    fill = PatternFill("solid", fgColor="6B2C7E")
    wrap = Alignment(wrap_text=True, vertical="top")
    by_key = {(e["structure"], e["month"]): e.get("answers", {}) for e in saved}
    months = [f"{year}-{m:02d}" for m in range(1, 13)]

    summary = book.active
    summary.title = "Indicateurs communs"
    numbers = [
        q for section in COMMON for q in section["questions"] if q["type"] == "number"
    ]
    summary.append([f"Année {year}", *(s["name"] for s in STRUCTURES), "Total"])
    for question in numbers:
        values = [
            sum(by_key.get((s["id"], m), {}).get(question["id"], 0) for m in months)
            for s in STRUCTURES
        ]
        summary.append([question["label"], *values, sum(values)])
    summary.append([])
    summary.append(
        [
            "Bilans remplis (mois)",
            *(sum((s["id"], m) in by_key for m in months) for s in STRUCTURES),
        ]
    )

    for structure in STRUCTURES:
        page = book.create_sheet(
            structure["name"][:31].replace("(", "").replace(")", "")
        )
        page.append(
            [structure["name"], *(f"{MONTHS[i]} {year}" for i in range(12)), "Total"]
        )
        for section in sections(structure):
            page.append([section["title"]])
            page.cell(page.max_row, 1).font = Font(bold=True, color="6B2C7E")
            for question in section["questions"]:
                values = [
                    by_key.get((structure["id"], m), {}).get(question["id"], "")
                    for m in months
                ]
                total = (
                    sum(v for v in values if isinstance(v, int | float))
                    if question["type"] == "number"
                    else ""
                )
                page.append([question["label"], *values, total])
        page.column_dimensions["A"].width = 55
        for column in "BCDEFGHIJKLMN":
            page.column_dimensions[column].width = 22
        for row in page.iter_rows(min_row=2):
            for cell in row:
                cell.alignment = wrap
        page.freeze_panes = "B2"

    for page in book.worksheets:
        for cell in page[1]:
            cell.font, cell.fill = head, fill
    summary.column_dimensions["A"].width = 60
    output = BytesIO()
    book.save(output)
    return output.getvalue()
