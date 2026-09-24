import json

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, ValidationError

router = APIRouter(prefix="/api")
MODEL = "qwen2.5:0.5b"
OLLAMA_URL = "http://127.0.0.1:11435/api/chat"


class ChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=2000)


class MatchEvent(BaseModel):
    title: str = Field(min_length=1, max_length=120)
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


class MatchSuggestion(BaseModel):
    resident_id: str
    rationale: str = Field(min_length=1, max_length=500)
    benefit: str = Field(min_length=1, max_length=300)
    vigilance: str = Field(min_length=1, max_length=300)


class MatchResponse(BaseModel):
    matches: list[MatchSuggestion] = Field(max_length=3)


def request_completion(message: str) -> str:
    with httpx.Client(timeout=120, trust_env=False) as client:
        response = client.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": message}],
                "stream": False,
                "options": {"num_ctx": 4096, "num_predict": 256},
            },
        )
        response.raise_for_status()
    content = response.json()["message"]["content"]
    if not content:
        raise HTTPException(502, "Le modèle n'a pas renvoyé de texte.")
    return content


def request_matching(request: MatchRequest) -> MatchResponse:
    profiles = [
        profile.model_dump() for profile in request.residents if profile.consent
    ]
    if not profiles:
        raise HTTPException(422, "Aucun profil ne dispose d'un consentement actif.")
    prompt = (
        "Tu aides une coordinatrice d'un lieu solidaire. Propose au maximum 3 mises en relation, "
        "uniquement à partir des informations fournies. N'infère aucune donnée sensible. "
        "Explique le lien, le bénéfice possible et un point à vérifier. La coordinatrice décide "
        "et la résidente doit ensuite consentir. Réponds uniquement selon le schéma JSON demandé.\n"
        f"Événement: {json.dumps(request.event.model_dump(), ensure_ascii=False)}\n"
        f"Profils fictifs consentants: {json.dumps(profiles, ensure_ascii=False)}"
    )
    with httpx.Client(timeout=120, trust_env=False) as client:
        response = client.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "format": MatchResponse.model_json_schema(),
                "options": {"num_ctx": 4096, "num_predict": 600, "temperature": 0},
            },
        )
        response.raise_for_status()
    try:
        result = MatchResponse.model_validate_json(
            response.json()["message"]["content"]
        )
    except (KeyError, TypeError, ValidationError) as exc:
        raise HTTPException(
            502, "Le modèle n'a pas produit un résultat exploitable."
        ) from exc
    allowed = {profile["id"] for profile in profiles}
    matches = []
    for match in result.matches:
        if match.resident_id in allowed and match.resident_id not in {
            item.resident_id for item in matches
        }:
            matches.append(match)
    if not matches:
        raise HTTPException(502, "Le modèle n'a proposé aucun profil valide.")
    return MatchResponse(matches=matches)


@router.post("/chat")
def chat(request: ChatRequest) -> dict[str, str]:
    try:
        return {"reply": request_completion(request.message)}
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "Le modèle a mis trop de temps à répondre.") from exc
    except httpx.RequestError as exc:
        raise HTTPException(503, "Ollama est inaccessible. Lancez make ai.") from exc
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            raise HTTPException(503, "Modèle absent. Lancez make model-pull.") from exc
        raise HTTPException(502, "Ollama n'a pas pu traiter la demande.") from exc


@router.post("/match", response_model=MatchResponse)
def match(request: MatchRequest) -> MatchResponse:
    try:
        return request_matching(request)
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "Le matching a pris trop de temps.") from exc
    except httpx.RequestError as exc:
        raise HTTPException(503, "Ollama est inaccessible. Lancez make ai.") from exc
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            raise HTTPException(503, "Modèle absent. Lancez make model-pull.") from exc
        raise HTTPException(502, "Ollama n'a pas pu produire le matching.") from exc
