"""Writes the funders to an Excel file in the tracker's format, read back by the import."""

from datetime import date
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

from .cells import ROW_COLORS, STATUS_LABELS
from .excel import DEFAULT_FOLLOWUP_MONTHS, FIELDS

TRACKER = (
    "Object pertinence pour chez Marthe",
    "Nom, Prénom du contact",
    "Institutionnel",
    "Historique d'accès à l'info",
    "Nom de la structure",
    "Mail",
    "Téléphone",
    "Nature de l'aide",
    "Document à envoyer",
    "Echéances",
    "Potentialité",
    "Premier contact effectué",
    "Liens utiles",
    "Informations",
    "Etat d'avancement de la candidature",
    "État (site)",
    "Date limite (site)",
    "Responsable (site)",
    "Identifiant (site)",
    "Couleur (site)",
    "Obtenu le (site)",
    "Relance en mois (site)",
    "Relance le (site)",
)
ROADMAP = (
    "Qui",
    "Source financière concernée",
    "Cadre de la demande",
    "Tâche",
    "Contact",
    "Date de réalisation",
    "Fait",
    "Identifiant de la piste",
)


def cell(value):
    """Text stays text: openpyxl would turn a leading "=" into a formula."""
    if isinstance(value, str) and value.startswith("="):
        return f" {value}"
    return value


def day(value) -> date | str:
    try:
        return date.fromisoformat(value)
    except TypeError, ValueError:
        return ""


def fill(sheet, headers: tuple, rows: list[list]) -> None:
    sheet.append(headers)
    for row in rows:
        sheet.append([cell(value) for value in row])
    for header in sheet[1]:
        header.font = Font(bold=True)
        sheet.column_dimensions[header.column_letter].width = 28
    for row in sheet.iter_rows(min_row=2):
        for item in row:
            item.alignment = Alignment(wrap_text=True, vertical="top")
    sheet.freeze_panes = "A2"


def tracker_row(funder: dict) -> list:
    values = [str(funder.get(key) or "") for key in FIELDS]
    # A row without name nor type would read back as the end of the row above.
    if not values[FIELDS.index("name")] and not values[FIELDS.index("type")]:
        values[FIELDS.index("name")] = "Piste sans nom"
    status = STATUS_LABELS.get(funder.get("status"), "")
    deadline = day(funder.get("deadline"))
    owner, color = funder.get("owner") or "", funder.get("color") or ""
    obtained = day(funder.get("obtainedOn"))
    months = funder.get("followupMonths") or DEFAULT_FOLLOWUP_MONTHS
    return [
        *values,
        status,
        deadline,
        owner,
        funder.get("id"),
        color,
        obtained,
        months,
        day(funder.get("followupOn")),
    ]


def write_tracker(funders: list[dict]) -> bytes:
    workbook = Workbook()
    tracker = workbook.active
    tracker.title = "Retroplanning"
    fill(tracker, TRACKER, [tracker_row(funder) for funder in funders])
    # The row colours chosen on the site, as in the team's own spreadsheet.
    for row, funder in zip(tracker.iter_rows(min_row=2), funders, strict=True):
        if color := ROW_COLORS.get(funder.get("color")):
            for item in row:
                item.fill = PatternFill("solid", fgColor=color)
    tasks = [
        [task.get("owner") or "", funder.get("name") or "Piste sans nom", ""]
        + [task.get("text") or "", "", day(task.get("due"))]
        + ["oui" if task.get("done") else "", funder.get("id")]
        for funder in funders
        for task in funder.get("tasks") or []
    ]
    fill(workbook.create_sheet("feuille de route"), ROADMAP, tasks)
    content = BytesIO()
    workbook.save(content)
    return content.getvalue()
