"""« Louer un espace » on the public home page: the cards the team adds, changes, orders or removes from the team space.

Until the team saves them, the page shows its own six cards (web/src/features/landing/rentalSpaces.js). Saved cards are a document
of the store ("rental_spaces"); photos the team uploads are kept in the store too (one document per photo), so they survive an update
of the server, and are served here with a long cache (each upload has its own address).
"""

import base64
import binascii
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
Team = Annotated[User, Depends(team_member)]
CARDS_KEY = "rental_spaces"
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


def photo_ids(cards: list[dict]) -> set[str]:
    return {
        card["photo"].removeprefix(PHOTO_URL)
        for card in cards
        if card["photo"].startswith(PHOTO_URL)
    }


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
    for photo in photo_ids(cards):
        if store.load_document(PHOTO_PREFIX + photo) is None:
            raise HTTPException(
                422, "Une photo n’existe plus : choisissez-la à nouveau."
            )
    store.save_document(CARDS_KEY, cards)
    # Photos no card uses anymore are deleted.
    used = photo_ids(cards)
    for key in store.list_keys(PHOTO_PREFIX):
        if key.removeprefix(PHOTO_PREFIX) not in used:
            store.delete_document(key)
    return {"cards": cards}


@router.delete("")
def reset_cards(user: Team) -> dict:
    """Back to the page's six original cards."""
    store.delete_document(CARDS_KEY)
    for key in store.list_keys(PHOTO_PREFIX):
        store.delete_document(key)
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
