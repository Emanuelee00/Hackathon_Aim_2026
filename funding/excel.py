"""Reads the funding tracker (AAP retroplanning.xlsx) into funder cards."""

from io import BytesIO
from uuid import uuid4

from openpyxl import load_workbook

from .cells import ROW_COLORS, STATUS_LABELS, iso_date, match_key, status, text

# Every column of the "Retroplanning" sheet, A to O, so the import loses nothing.
FIELDS = (
    "purpose",
    "contact",
    "type",
    "history",
    "name",
    "email",
    "phone",
    "amount",
    "documents",
    "deadlineNote",
    "potential",
    "firstContact",
    "links",
    "notes",
    "progress",
)
# Columns P to T, added by the site's own Excel file so a round trip loses nothing.
SITE_FIELDS = ("siteStatus", "siteDeadline", "siteOwner", "siteId", "siteColor")


def new_card(cells: dict) -> dict:
    values = {key: text(cells[key]) for key in FIELDS}
    # Some funders are only named in the "Institutionnel" column.
    name, kind = (
        values["name"] or values["type"],
        values["type"] if values["name"] else "",
    )
    card = {**values, "name": name, "type": kind, "tasks": [], "color": ""}
    if text(cells["siteId"]):
        # A file saved by the site: its own columns are the reference.
        statuses = {label: key for key, label in STATUS_LABELS.items()}
        return card | {
            "id": text(cells["siteId"]),
            "status": statuses.get(text(cells["siteStatus"]), "qualify"),
            "deadline": iso_date(cells["siteDeadline"]),
            "owner": text(cells["siteOwner"]),
            "color": text(cells["siteColor"])
            if text(cells["siteColor"]) in ROW_COLORS
            else "",
        }
    deadline = iso_date(cells["deadlineNote"])
    return card | {
        "id": uuid4().hex,
        "status": status(card),
        "deadline": deadline,
        "owner": "",
    }


def read_cards(sheet) -> list[dict]:
    """One card per funder; rows without a name continue the card above."""
    cards = []
    columns = FIELDS + SITE_FIELDS
    for row in sheet.iter_rows(min_row=2, max_col=len(columns), values_only=True):
        cells = dict(zip(columns, row))
        if text(cells["name"]) or text(cells["type"]):
            cards.append(new_card(cells))
        elif cards:
            card = cards[-1]
            for key in FIELDS:
                if value := text(cells[key]):
                    card[key] = f"{card[key]}\n{value}".strip()
    return cards


def find_card(cards: list[dict], name: str) -> dict | None:
    key = match_key(name)
    if len(key) < 3:
        return None
    exact = next((card for card in cards if match_key(card["name"]) == key), None)
    return exact or next(
        (
            card
            for card in cards
            if key in match_key(card["name"]) or match_key(card["name"]) in key
        ),
        None,
    )


def attach_tasks(cards: list[dict], sheet) -> None:
    """The "feuille de route" tasks become the tasks of the funder they name."""
    card = None
    rows = sheet.iter_rows(min_row=2, max_col=8, values_only=True)
    # Columns G and H (done, funder id) only exist in files saved by the site.
    for owner, funder, context, task, contact, when, done, funder_id in rows:
        notes = (context, contact)
        if owner or funder:
            by_id = (card for card in cards if card["id"] == text(funder_id))
            card = next(by_id, None) if funder_id else find_card(cards, text(funder))
            owner = text(owner).replace("?", "").strip()
            label = (
                text(task)
                if iso_date(when) or not when
                else f"{text(task)} ({text(when)})"
            )
            if card:
                card["tasks"].append(
                    {
                        "id": uuid4().hex,
                        "text": label,
                        "owner": owner,
                        "due": iso_date(when),
                        "done": bool(text(done)),
                    }
                )
                if not funder_id:
                    card["owner"] = card["owner"] or owner
        else:
            # A row without owner nor funder continues the task above.
            notes = (task, context, contact)
        extra = "\n".join(text(value) for value in notes if value)
        if card and extra:
            card["notes"] = f"{card['notes']}\n{extra}".strip()


def read_tracker(content: bytes) -> list[dict]:
    workbook = load_workbook(BytesIO(content), data_only=True, read_only=False)
    sheets = {sheet.title.strip().lower(): sheet for sheet in workbook}
    cards = read_cards(sheets["retroplanning"])
    if "feuille de route" in sheets:
        attach_tasks(cards, sheets["feuille de route"])
    return cards
