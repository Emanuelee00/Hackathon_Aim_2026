"""Les espaces personnels de l'équipe : après la connexion à l'espace équipe, chacune choisit son prénom (« Qui êtes-vous ? »)
et retrouve son espace, le même pour toutes, mais avec son menu à elle (ordre et rubriques mises en avant) et ses fonds
(couleur ou image, pour la page et pour le menu). Enregistré sur le serveur : on le retrouve sur n'importe quel ordinateur.

Ce n'est pas une sécurité : toutes se connectent avec le compte de l'équipe ; le prénom choisi sert à personnaliser."""

import re
from typing import Annotated, Literal

import espaces
from accounts.models import User
from accounts.sessions import team_member
from core import store
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator

router = APIRouter(prefix="/api/profils")
Team = Annotated[User, Depends(team_member)]
KEY = espaces.PROFILES_KEY
MAX_PROFILES = 40
COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
MenuId = Annotated[str, Field(pattern=r"^[a-z][a-zA-Z0-9-]{0,29}$")]


class Background(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["none", "color", "image"] = "none"
    value: str = Field(default="", max_length=200)

    @field_validator("value")
    @classmethod
    def known_value(cls, value: str, info) -> str:
        kind = info.data.get("kind")
        if kind == "color" and not COLOR.match(value):
            raise ValueError("Couleur invalide.")
        if kind == "image" and not (value and espaces.PHOTO.match(value)):
            raise ValueError("Image invalide.")
        return value if kind != "none" else ""


class Profile(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    id: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{0,39}$")
    name: str = Field(min_length=1, max_length=60)
    role: str = Field(default="", max_length=100)
    photo: str = Field(default="", max_length=200)
    menuOrder: list[MenuId] = Field(default=[], max_length=40)
    starred: list[MenuId] = Field(default=[], max_length=40)
    pageBackground: Background = Background()
    menuBackground: Background = Background()
    # Clair, sombre (☀) ou violet sombre (M de Chez Marthe).
    theme: Literal["light", "dark", "violet"] = "light"

    @field_validator("photo")
    @classmethod
    def known_photo(cls, value: str) -> str:
        if not espaces.PHOTO.match(value):
            raise ValueError("Photo invalide.")
        return value


def profiles() -> list[dict] | None:
    return store.load_document(KEY)  # type: ignore[arg-type]


@router.get("")
def read(_: Team) -> dict:
    """Les espaces enregistrés, ou null tant que personne n'a rien changé (la page part alors de l'équipe du site)."""
    return {"profiles": profiles()}


@router.put("")
def save_all(body: list[Profile], _: Team) -> dict:
    """La première fois : la liste de départ (l'équipe du site), enregistrée telle quelle."""
    if len(body) > MAX_PROFILES:
        raise HTTPException(422, "Trop de personnes.")
    saved = [p.model_dump() for p in body]
    if len({p["id"] for p in saved}) != len(saved):
        raise HTTPException(422, "Deux personnes ont le même identifiant.")
    espaces.check_photos(saved)
    store.save_document(KEY, saved)  # type: ignore[arg-type]
    espaces.forget_unused_photos()
    return {"profiles": saved}


@router.put("/{profile_id}")
def save_one(profile_id: str, profile: Profile, _: Team) -> dict:
    """Un seul espace change : les autres restent tels qu'ils sont sur le serveur (deux personnes peuvent travailler en même temps)."""
    if profile.id != profile_id:
        raise HTTPException(422, "Identifiant différent.")
    saved = profile.model_dump()
    espaces.check_photos(saved)
    current = profiles() or []
    if not any(p["id"] == profile_id for p in current) and len(current) >= MAX_PROFILES:
        raise HTTPException(422, "Trop de personnes.")
    updated = [saved if p["id"] == profile_id else p for p in current]
    if saved not in updated:
        updated.append(saved)
    store.save_document(KEY, updated)  # type: ignore[arg-type]
    espaces.forget_unused_photos()
    return {"profiles": updated}


@router.delete("/{profile_id}")
def remove(profile_id: str, _: Team) -> dict:
    updated = [p for p in profiles() or [] if p["id"] != profile_id]
    store.save_document(KEY, updated)  # type: ignore[arg-type]
    espaces.forget_unused_photos()
    return {"profiles": updated}
