import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/api")
MODEL = "qwen2.5:0.5b"
OLLAMA_URL = "http://127.0.0.1:11435/api/chat"


class ChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=2000)


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
