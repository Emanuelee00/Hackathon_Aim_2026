"""Cell readers for the funding tracker: dates, statuses and name matching."""

import re
import unicodedata
from datetime import datetime

# The labels of web/src/features/funding/funding.js, written in the site's export.
STATUS_LABELS = {
    "qualify": "À qualifier",
    "check": "À vérifier",
    "todo": "À traiter",
    "priority": "Prioritaire",
    "submitted": "Déposé",
    "validated": "Presque validé",
    "closed": "Clôturé",
    "ineligible": "Pas éligible",
}
# Row colours of web/src/features/funding/funding.js, as Excel fills.
ROW_COLORS = {
    "rose": "FDE2E7",
    "lilas": "ECE3F5",
    "sable": "FBF3C9",
    "menthe": "DCF2E6",
    "ciel": "DBEAF7",
    "gris": "ECECEC",
}
# The free-text "Potentialité" column, read in order: the first match wins.
STATUSES = [
    ("presque", "validated"),
    ("envoyé", "submitted"),
    ("déposé", "submitted"),
    ("prioritaire", "priority"),
    ("pas éligible", "ineligible"),
    ("clôturé", "closed"),
    ("réserve", "check"),
    ("inaccessible", "check"),
    ("compléter", "check"),
]
MONTHS = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
]
STOPWORDS = {
    "fondation",
    "fonds",
    "fond",
    "la",
    "le",
    "les",
    "du",
    "de",
    "des",
    "pour",
    "aap",
    "programme",
}


def text(value) -> str:
    if isinstance(value, datetime):
        return value.date().isoformat()
    return str(value).strip() if value is not None else ""


def iso_date(value) -> str:
    """The first date found in a cell (a real date, 01/11/2026 or 30 septembre 2026)."""
    if isinstance(value, datetime):
        return value.date().isoformat()
    found = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", text(value))
    if found:
        day, month, year = found.groups()
        return f"{year}-{int(month):02}-{int(day):02}"
    found = re.search(
        rf"(\d{{1,2}}) ({'|'.join(MONTHS)}) (\d{{4}})", text(value).lower()
    )
    if found:
        day, month, year = found.groups()
        return f"{year}-{MONTHS.index(month) + 1:02}-{int(day):02}"
    return ""


def status(card: dict) -> str:
    potential = card["potential"].lower()
    found = next(
        (value for word, value in STATUSES if word in potential),
        "todo" if potential else "qualify",
    )
    # The notes sometimes say a file was sent while "Potentialité" was not updated.
    notes = f"{card['history']} {card['documents']} {card['progress']}".lower()
    sent = re.search(r"déposée?|envoyée?\b", notes)
    return "submitted" if sent and found not in ("validated", "ineligible") else found


def match_key(name: str) -> str:
    plain = (
        unicodedata.normalize("NFKD", name.lower()).encode("ascii", "ignore").decode()
    )
    return "".join(
        word for word in re.findall(r"[a-z0-9]+", plain) if word not in STOPWORDS
    )
