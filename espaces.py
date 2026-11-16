"""The public home page as the team edits it in « Site »: the texts, photos and lists of each section, which sections are shown,
and the cards of « Louer un espace ».

Until the team saves them, the page shows its own content (web/src/features/landing/siteContent.js and rentalSpaces.js). Saved
content and cards are documents of the store ("site_content", "rental_spaces"); photos the team uploads are kept in the store too
(one document per photo), so they survive an update of the server, and are served here with a long cache (each upload has its own
address). A photo no saved content uses anymore is deleted.
"""

import base64
import binascii
import json
import re
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, Field

import store
from accounts.models import User
from accounts.sessions import team_member

router = APIRouter(prefix="/api/espaces-a-louer")
site_router = APIRouter(prefix="/api/site")
Team = Annotated[User, Depends(team_member)]
CARDS_KEY = "rental_spaces"
CONTENT_KEY = "site_content"
PROFILES_KEY = (
    "team_profiles"  # profils.py : les espaces personnels (photos de fond envoyées)
)
PHOTO_PREFIX = "rental_photo_"
PHOTO_URL = "/api/espaces-a-louer/photos/"
MAX_PHOTO_BYTES = 1_500_000
DATA_URL = re.compile(r"^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$")
Line = Annotated[str, Field(max_length=160, pattern=r"^[^\x00-\x1f]*$")]
Slug = Annotated[str, Field(min_length=1, max_length=60, pattern=r"^[\w-]+$")]
# A photo of the site (/foto/...), or one uploaded here.
Photo = Annotated[
    str,
    Field(
        max_length=200,
        pattern=r"^(/foto/[\w./-]+|/api/espaces-a-louer/photos/[\w-]+)$",
    ),
]
Url = Annotated[str, Field(max_length=300, pattern=r"^https?://[^\s]+$")]


class Link(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    url: Url
    label: Line = Field(min_length=1)


class Card(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    id: Slug
    name: Line = Field(min_length=1)
    photo: Photo
    focus: Annotated[str, Field(max_length=20, pattern=r"^[a-z0-9% ]*$")] = "center 50%"
    details: list[Line] = Field(default_factory=list, max_length=8)
    prices: list[tuple[Line, Line]] = Field(default_factory=list, max_length=8)
    note: Annotated[str, Field(max_length=400)] = ""
    exchange: Annotated[str, Field(max_length=400)] = ""
    link: Link | None = None
    # The space of the request form the « Faire une demande » button opens (spaces of the site); empty: no form.
    space: Annotated[str, Field(max_length=60, pattern=r"^[\w-]*$")] = ""


class Cards(BaseModel):
    cards: list[Card] = Field(max_length=20)


class Upload(BaseModel):
    data: Annotated[str, Field(max_length=2_100_000)]


PHOTO_ID = re.compile(re.escape(PHOTO_URL) + r"([\w-]+)")


def photos_in(value) -> set[str]:
    """Uploaded photos a saved document uses."""
    return set(PHOTO_ID.findall(json.dumps(value)))


def check_photos(value) -> None:
    for photo in photos_in(value):
        if store.load_document(PHOTO_PREFIX + photo) is None:
            raise HTTPException(
                422, "Une photo n’existe plus : choisissez-la à nouveau."
            )


def forget_unused_photos() -> None:
    used = (
        photos_in(store.load_document(CARDS_KEY))
        | photos_in(store.load_document(CONTENT_KEY))
        | photos_in(store.load_document(PROFILES_KEY))
    )
    for key in store.list_keys(PHOTO_PREFIX):
        if key.removeprefix(PHOTO_PREFIX) not in used:
            store.delete_document(key)


@router.get("")
def read_cards() -> dict:
    """The saved cards, or null while the team has not changed the original ones (public: the home page reads it)."""
    return {"cards": store.load_document(CARDS_KEY)}


@router.put("")
def save_cards(body: Cards, user: Team) -> dict:
    cards = body.model_dump()["cards"]
    ids = [card["id"] for card in cards]
    if len(ids) != len(set(ids)):
        raise HTTPException(422, "Deux cartes ont le même identifiant.")
    check_photos(cards)
    store.save_document(CARDS_KEY, cards)
    forget_unused_photos()
    return {"cards": cards}


@router.delete("")
def reset_cards(user: Team) -> dict:
    """Back to the page's six original cards."""
    store.delete_document(CARDS_KEY)
    forget_unused_photos()
    return {"cards": None}


@router.post("/photos")
def upload_photo(upload: Upload, user: Team) -> dict:
    """A photo already resized by the page, as a data URL (JPEG, PNG or WebP, at most 1.5 MB)."""
    match = DATA_URL.match(upload.data)
    if not match:
        raise HTTPException(422, "Choisissez une image JPEG, PNG ou WebP.")
    try:
        content = base64.b64decode(match[2], validate=True)
    except binascii.Error as error:
        raise HTTPException(422, "Image illisible.") from error
    if len(content) > MAX_PHOTO_BYTES:
        raise HTTPException(413, "Image trop lourde (1,5 Mo au plus).")
    photo = uuid4().hex
    store.save_document(PHOTO_PREFIX + photo, [match[1], match[2]])
    return {"url": PHOTO_URL + photo}


@router.get("/photos/{photo}")
def read_photo(photo: Slug) -> Response:
    saved = store.load_document(PHOTO_PREFIX + photo)
    if not saved:
        raise HTTPException(404, "Photo introuvable.")
    media_type, data = saved
    return Response(
        base64.b64decode(data),
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


# ---------- The rest of the home page (texts, photos, lists, sections shown or hidden) ----------

SECTIONS = {
    "hero",
    "place",
    "team",
    "pillars",
    "events",
    "spaces",
    "partners",
    "involve",
    "contact",
}
KEY = re.compile(r"^[a-zA-Z][a-zA-Z0-9]{0,29}$")
PHOTO = re.compile(r"^(|/foto/[\w./-]+|/api/espaces-a-louer/photos/[\w-]+)$")
LINK = re.compile(r"^(|https?://\S+|mailto:\S+|#[\w-]+|/[\w./#-]*)$")
MAX_CONTENT = 300_000


def check_value(value, key: str = "", depth: int = 0) -> None:
    """Only plain texts, yes/no, numbers, lists and objects; photos from the site or uploaded here; links that are web addresses."""
    if depth > 6:
        raise HTTPException(422, "Contenu trop imbriqué.")
    if isinstance(value, dict):
        if len(value) > 40 or not all(
            isinstance(k, str) and KEY.match(k) for k in value
        ):
            raise HTTPException(422, "Champ inconnu.")
        for name, item in value.items():
            check_value(item, name, depth + 1)
    elif isinstance(value, list):
        if len(value) > 40:
            raise HTTPException(422, "Liste trop longue (40 au plus).")
        for item in value:
            check_value(item, key, depth + 1)
    elif isinstance(value, str):
        if len(value) > 2000:
            raise HTTPException(422, "Texte trop long (2 000 caractères au plus).")
        if key in ("photo", "logo") and not PHOTO.match(value):
            raise HTTPException(422, "Photo invalide : choisissez-la à nouveau.")
        if key == "url" and not LINK.match(value):
            raise HTTPException(
                422, "Un lien doit commencer par https://, / ou # (ou mailto:)."
            )
    elif value is not None and not isinstance(value, (bool, int, float)):
        raise HTTPException(422, "Contenu invalide.")


class Content(BaseModel):
    content: dict


@site_router.get("")
def read_site() -> dict:
    """What the home page needs: the team's content (with "order", the order of the sections) and cards, or null (public)."""
    return {
        "content": store.load_document(CONTENT_KEY),
        "cards": store.load_document(CARDS_KEY),
    }


@site_router.put("/contenu")
def save_content(body: Content, user: Team) -> dict:
    content = body.content
    if not set(content) <= SECTIONS | {"order"}:
        raise HTTPException(422, "Section inconnue.")
    order = content.get("order", [])
    if (
        not isinstance(order, list)
        or len(set(order)) != len(order)
        or not set(order) <= SECTIONS
    ):
        raise HTTPException(422, "Ordre des sections invalide.")
    check_value(content)
    if len(json.dumps(content)) > MAX_CONTENT:
        raise HTTPException(413, "Contenu trop long.")
    check_photos(content)
    store.save_document(CONTENT_KEY, content)
    forget_unused_photos()
    return {"content": content}


@site_router.delete("/contenu")
def reset_content(user: Team) -> dict:
    """Back to the original texts and photos of every section (the cards of « Louer un espace » stay)."""
    store.delete_document(CONTENT_KEY)
    forget_unused_photos()
    return {"content": None}
