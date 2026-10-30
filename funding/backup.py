"""One copy of the funders per day, in the server's database next to the site's data."""

from datetime import UTC, datetime

import store

PREFIX = "funders@"
KEEP = 30


def save_copy(funders: list) -> None:
    """Rewrites today's copy, so each day keeps its last state; the oldest go."""
    today = datetime.now(UTC).astimezone().date().isoformat()
    store.save_document(f"{PREFIX}{today}", funders)
    for key in store.list_keys(PREFIX)[:-KEEP]:
        store.delete_document(key)


def copy_days() -> list[str]:
    return [key.removeprefix(PREFIX) for key in reversed(store.list_keys(PREFIX))]


def load_copy(day: str) -> list | None:
    return store.load_document(f"{PREFIX}{day}")
