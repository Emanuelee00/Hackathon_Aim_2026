import json
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ValidationError

from ai import MODEL, OLLAMA_URL
from ranking import guided_rationale, rank_profiles

router = APIRouter(prefix="/api")
# Keeps the whole matching under 10 seconds, fallback included.
MODEL_TIMEOUT = httpx.Timeout(9, connect=1)


class MatchEvent(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    category: str = Field(default="", max_length=60)
    description: str = Field(max_length=1200)
    opportunity: str = Field(max_length=600)


class ResidentProfile(BaseModel):
    id: str = Field(pattern=r"^[a-z0-9-]+$", max_length=40)
    first_name: str = Field(min_length=1, max_length=60)
    goals: list[str] = Field(min_length=1, max_length=6)
    skills: list[str] = Field(max_length=8)
    languages: list[str] = Field(max_length=6)
    availability: str = Field(max_length=200)
    consent: bool


class MatchRequest(BaseModel):
    event: MatchEvent
    residents: list[ResidentProfile] = Field(min_length=1, max_length=10)


class Rationale(BaseModel):
    resident_id: str
    rationale: str = Field(min_length=1, max_length=500)
    benefit: str = Field(min_length=1, max_length=300)
    vigilance: str = Field(min_length=1, max_length=300)


class ModelOutput(BaseModel):
    matches: list[Rationale] = Field(max_length=3)


class MatchSuggestion(Rationale):
    source: Literal["ai", "guided"]


class MatchResponse(BaseModel):
    matches: list[MatchSuggestion] = Field(max_length=3)


def write_rationales(event: dict, ranked: list[tuple[dict, list[str]]]) -> dict:
    """Ask the model to explain the chosen profiles; empty when it fails or is slow."""
    profiles = [{**profile, "liens_detectes": terms} for profile, terms in ranked]
    prompt = (
        "Tu aides une coordinatrice d'un lieu solidaire. Pour CHAQUE profil fourni, dans le même ordre, "
        "écris en français une phrase courte expliquant le lien avec l'événement, un bénéfice possible "
        "et un point à vérifier. Appuie-toi sur les liens détectés et n'invente rien. La coordinatrice "
        "décide et la résidente consent ensuite. Réponds uniquement selon le schéma JSON.\n"
        f"Événement: {json.dumps(event, ensure_ascii=False)}\n"
        f"Profils fictifs consentants: {json.dumps(profiles, ensure_ascii=False)}"
    )
    try:
        with httpx.Client(timeout=MODEL_TIMEOUT, trust_env=False) as client:
            response = client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                    "keep_alive": -1,
                    "format": ModelOutput.model_json_schema(),
                    "options": {"num_ctx": 4096, "num_predict": 450, "temperature": 0},
                },
            )
            response.raise_for_status()
        output = ModelOutput.model_validate_json(response.json()["message"]["content"])
    except httpx.HTTPError, KeyError, TypeError, ValidationError:
        return {}
    return {item.resident_id: item.model_dump() for item in output.matches}


def request_matching(request: MatchRequest) -> MatchResponse:
    profiles = [
        profile.model_dump() for profile in request.residents if profile.consent
    ]
    if not profiles:
        raise HTTPException(422, "Aucun profil ne dispose d'un consentement actif.")
    event = request.event.model_dump()
    ranked = rank_profiles(" ".join(event.values()), profiles)
    written = write_rationales(event, ranked)
    matches = []
    for profile, terms in ranked:
        if profile["id"] in written:
            matches.append(MatchSuggestion(**written[profile["id"]], source="ai"))
        else:
            text = guided_rationale(profile["first_name"], terms)
            matches.append(
                MatchSuggestion(resident_id=profile["id"], **text, source="guided")
            )
    return MatchResponse(matches=matches)


@router.post("/match", response_model=MatchResponse)
def match(request: MatchRequest) -> MatchResponse:
    return request_matching(request)
