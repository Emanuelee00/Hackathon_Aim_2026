"""Laughs a resident or volunteer keeps for herself: never shown to the others."""

import re

from accounts.models import User

DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
# Enough for years of laughs, while one account cannot fill the database.
MAX_PER_PERSON = 1000


def owner(user: User) -> str:
    return str(user.id)


def own_laughs(laughs: list[dict], user: User) -> list[dict]:
    return [laugh for laugh in laughs if laugh.get("owner") == owner(user)]


def merge_laughs(current: list[dict], incoming: list[dict], user: User) -> list[dict]:
    """Her list replaces her own laughs; the owner is always the signed-in account."""
    others = [laugh for laugh in current if laugh.get("owner") != owner(user)]
    mine = [
        {"id": laugh["id"][:64], "owner": owner(user), "date": laugh["date"]}
        for laugh in incoming
        if isinstance(laugh.get("id"), str)
        and isinstance(laugh.get("date"), str)
        and DATE.match(laugh["date"])
    ]
    return others + mine[-MAX_PER_PERSON:]
