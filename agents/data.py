"""Read-only views of the shared store, each cut to what one audience may see."""

import json
import unicodedata
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import store

PARIS = ZoneInfo("Europe/Paris")
RULES = Path(__file__).parent / "knowledge" / "renseignements.md"
# What anyone signed in may know about an event: no contacts, money or residents.
PUBLIC_FIELDS = (
    "title",
    "category",
    "date",
    "start",
    "end",
    "space",
    "status",
    "description",
)


def stored(key: str) -> list[dict]:
    """A store document, empty until a browser has saved it once."""
    rows = store.execute("SELECT value FROM documents WHERE key = ?", (key,))
    return json.loads(rows[0][0]) if rows else []


def pick(item: dict, fields: tuple[str, ...]) -> dict:
    return {
        field: item.get(field) for field in fields if item.get(field) not in (None, "")
    }


def upcoming(events: list[dict]) -> list[dict]:
    """Events still to come and not refused, in date order."""
    today = datetime.now(PARIS).date().isoformat()
    kept = [
        e
        for e in events
        if e.get("status") in ("pending", "confirmed") and e.get("date", "") >= today
    ]
    return sorted(kept, key=lambda event: f"{event['date']}{event.get('start', '')}")


def same_name(first: str, second: str) -> bool:
    """Names match without case or accents, as the pages compare them ("Léa" = "lea")."""

    def plain(text: str) -> str:
        decomposed = unicodedata.normalize("NFD", text.strip().casefold())
        return "".join(char for char in decomposed if not unicodedata.combining(char))

    return plain(first) == plain(second)


def as_text(data) -> str:
    return json.dumps(data, ensure_ascii=False) if data else "Aucun résultat."
