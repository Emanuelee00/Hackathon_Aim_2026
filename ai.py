import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/api")
NEMOTRON_URL = os.getenv(
    "NEMOTRON_URL", "https://integrate.api.nvidia.com/v1/chat/completions"
)
NEMOTRON_MODEL = os.getenv("NEMOTRON_MODEL", "nvidia/nemotron-3-nano-30b-a3b")
# Keep OLLAMA_URL/MODEL aliases for backward compatibility if referenced anywhere.
OLLAMA_URL = os.getenv("OLLAMA_URL", NEMOTRON_URL)
MODEL = os.getenv("NEMOTRON_MODEL", NEMOTRON_MODEL)
# MARTHE_AI=0 turns every model call off (production without external LLM):
# matching, plans and CV lines use their guided texts, chatbots answer 503.
AI_ENABLED = os.getenv("MARTHE_AI", "1") != "0"


class ChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=2000)


def _nemotron_headers() -> dict[str, str]:
    api_key = os.getenv("NVIDIA_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(503, "Clé Nemotron (NVIDIA_API_KEY) non configurée.")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def request_completion(message: str) -> str:
    headers = _nemotron_headers()
    url = os.getenv("NEMOTRON_URL", NEMOTRON_URL)
    model = os.getenv("NEMOTRON_MODEL", NEMOTRON_MODEL)
    with httpx.Client(timeout=120, trust_env=False) as client:
        response = client.post(
            url,
            headers=headers,
            json={
                "model": model,
                "messages": [{"role": "user", "content": message}],
                "max_tokens": 256,
                "stream": False,
            },
        )
        response.raise_for_status()
    payload = response.json()
    choices = payload.get("choices") or []
    msg = (choices[0].get("message") if choices else None) or {}
    content = msg.get("content")
    if not content:
        raise HTTPException(502, "Le modèle n'a pas renvoyé de texte.")
    return content


def warm_up() -> None:
    """Ping Nemotron once at startup if configured so connection pool is warm."""
    if not AI_ENABLED or not os.getenv("NVIDIA_API_KEY", "").strip():
        return
    try:
        request_completion("ping")
    except httpx.HTTPError, HTTPException:
        pass


@router.post("/chat")
def chat(request: ChatRequest) -> dict[str, str]:
    if not AI_ENABLED:
        raise HTTPException(503, "L’IA est désactivée sur ce serveur.")
    try:
        return {"reply": request_completion(request.message)}
    except HTTPException:
        raise
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "Le modèle a mis trop de temps à répondre.") from exc
    except httpx.RequestError as exc:
        raise HTTPException(503, "Service Nemotron inaccessible.") from exc
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (401, 403):
            raise HTTPException(503, "Clé API Nemotron invalide ou refusée.") from exc
        if exc.response.status_code == 404:
            raise HTTPException(503, "Modèle Nemotron introuvable.") from exc
        raise HTTPException(502, "Nemotron n'a pas pu traiter la demande.") from exc
