"""Lecture seule de Google Agenda avec un compte de service (pas de login humain).

Variables d'environnement :
  GOOGLE_CALENDAR_ID        identifiant du calendrier partagé avec le compte de service
  GOOGLE_CREDENTIALS_FILE   chemin du fichier JSON de la clé (hors Git, voir secrets/)
"""
import base64
import json
import os
import time
from datetime import date, timedelta
from pathlib import Path

import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
TOKEN_URL = "https://oauth2.googleapis.com/token"
API = "https://www.googleapis.com/calendar/v3/calendars"


class GoogleCalendarError(RuntimeError):
    pass


def _b64(data: bytes) -> bytes:
    return base64.urlsafe_b64encode(data).rstrip(b"=")


def _credentials(path: str | None = None) -> dict:
    file = Path(path or os.environ.get("GOOGLE_CREDENTIALS_FILE", "secrets/google-calendar.json"))
    if not file.is_file():
        raise GoogleCalendarError(f"Clé Google introuvable : {file}")
    return json.loads(file.read_text(encoding="utf-8"))


def access_token(credentials: dict, client: httpx.Client) -> str:
    now = int(time.time())
    header = _b64(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())
    claims = _b64(json.dumps({"iss": credentials["client_email"], "scope": SCOPE, "aud": TOKEN_URL, "iat": now, "exp": now + 3600}).encode())
    key = serialization.load_pem_private_key(credentials["private_key"].encode(), password=None)
    signature = key.sign(header + b"." + claims, padding.PKCS1v15(), hashes.SHA256())
    response = client.post(TOKEN_URL, data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": (header + b"." + claims + b"." + _b64(signature)).decode()})
    if response.status_code != 200:
        raise GoogleCalendarError(f"Connexion refusée par Google ({response.status_code}) : {response.json().get('error_description', '')}")
    return response.json()["access_token"]


def list_events(time_min: str, time_max: str, calendar_id: str | None = None, credentials_file: str | None = None) -> list[dict]:
    """Événements entre deux dates ISO (ex. 2026-11-01T00:00:00Z), répétitions développées, triés par début."""
    calendar_id = calendar_id or os.environ.get("GOOGLE_CALENDAR_ID", "")
    if not calendar_id:
        raise GoogleCalendarError("GOOGLE_CALENDAR_ID n'est pas défini")
    with httpx.Client(timeout=20) as client:
        headers = {"Authorization": f"Bearer {access_token(_credentials(credentials_file), client)}"}
        events, page = [], None
        while True:
            params = {"timeMin": time_min, "timeMax": time_max, "singleEvents": "true", "orderBy": "startTime", "maxResults": 250}
            if page:
                params["pageToken"] = page
            response = client.get(f"{API}/{calendar_id}/events", params=params, headers=headers)
            if response.status_code == 404:
                raise GoogleCalendarError("Calendrier introuvable : il n'est pas partagé avec le compte de service, ou l'identifiant est faux")
            if response.status_code != 200:
                raise GoogleCalendarError(f"Google Agenda a répondu {response.status_code} : {response.text[:200]}")
            body = response.json()
            events += [e for e in body.get("items", []) if e.get("status") != "cancelled"]
            page = body.get("nextPageToken")
            if not page:
                return events


_weeks: dict = {}
MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]


def week_public(monday: date, ttl: int = 60) -> list[dict]:
    """Évènements publics d'une semaine (du lundi au dimanche) : titre, date, heures, lieu. Jamais la description (notes internes).

    Garde chaque semaine en mémoire `ttl` secondes (1 minute) ; si Google est injoignable, renvoie la dernière version connue.
    """
    cached = _weeks.get(monday)
    if cached and time.time() - cached[0] < ttl:
        return cached[1]
    days = [monday + timedelta(days=n) for n in range(7)]
    wanted = {d.isoformat() for d in days}
    # Marge d'un jour de chaque côté : on garde ensuite la date locale écrite par Google.
    start = (monday - timedelta(days=1)).isoformat() + "T00:00:00Z"
    end = (monday + timedelta(days=8)).isoformat() + "T00:00:00Z"
    try:
        events = list_events(start, end)
    except (GoogleCalendarError, httpx.HTTPError, OSError):
        return cached[1] if cached else []
    items = []
    for event in events:
        title = (event.get("summary") or "").strip()
        begin, finish = event.get("start", {}), event.get("end", {})
        stamp = begin.get("dateTime") or begin.get("date")
        if not title or not stamp or stamp[:10] not in wanted:
            continue
        timed = "dateTime" in begin
        items.append({
            "title": title,
            "date": stamp[:10],
            "start": stamp[11:16] if timed else "",
            "end": (finish.get("dateTime") or "")[11:16] if timed else "",
            "place": (event.get("location") or "").split(",")[0].strip(),
        })
    _weeks[monday] = (time.time(), items)
    return items


_ranges: dict = {}


def team_calendars() -> list[dict]:
    """Agendas montrés dans le calendrier de l'équipe : clé, nom, couleurs, identifiant (fichier hors Git)."""
    file = Path(os.environ.get("GOOGLE_CALENDARS_FILE", "secrets/calendars.json"))
    return json.loads(file.read_text(encoding="utf-8")) if file.is_file() else []


def team_range(first: date, last: date, ttl: int = 60) -> dict:
    """Évènements de tous les agendas entre deux dates (incluses), pour l'équipe connectée.

    Un agenda illisible n'empêche pas les autres : son nom est renvoyé dans `errors`.
    """
    cached = _ranges.get((first, last))
    if cached and time.time() - cached[0] < ttl:
        return cached[1]
    start = (first - timedelta(days=1)).isoformat() + "T00:00:00Z"
    end = (last + timedelta(days=2)).isoformat() + "T00:00:00Z"
    items, errors = [], []
    for calendar in team_calendars():
        try:
            events = list_events(start, end, calendar_id=calendar["id"])
        except (GoogleCalendarError, httpx.HTTPError, OSError):
            errors.append(calendar["name"])
            continue
        for event in events:
            begin, finish = event.get("start", {}), event.get("end", {})
            stamp = begin.get("dateTime") or begin.get("date")
            if not stamp or not first.isoformat() <= stamp[:10] <= last.isoformat():
                continue
            timed = "dateTime" in begin
            items.append({
                "calendar": calendar["key"],
                "title": (event.get("summary") or "(sans titre)").strip(),
                "date": stamp[:10],
                "start": stamp[11:16] if timed else "",
                "end": (finish.get("dateTime") or "")[11:16] if timed else "",
                "place": (event.get("location") or "").split(",")[0].strip(),
            })
    result = {"calendars": [{k: c[k] for k in ("key", "name", "color", "bg")} for c in team_calendars()], "events": sorted(items, key=lambda e: (e["date"], e["start"])), "errors": errors}
    if errors and cached:
        return cached[1]
    _ranges[(first, last)] = (time.time(), result)
    return result
