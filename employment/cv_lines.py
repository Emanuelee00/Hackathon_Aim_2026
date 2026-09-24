"""CV wording for skills practised at Marthe, adapted to the job sought."""

import json
import time

import httpx
from pydantic import ValidationError

from ai import MODEL, OLLAMA_URL
from demo import DEMO_DELAY, DEMO_MODE, demo_cv_lines

from .models import CvLine, CvLines, CvLinesContent, CvLinesRequest

# Keeps the answer under 10 seconds, fallback included.
MODEL_TIMEOUT = httpx.Timeout(9, connect=1)


def guided_lines(request: CvLinesRequest) -> CvLines:
    lines = [
        CvLine(
            skill=item.skill,
            line=f"Activité collective chez Marthe (Marseille), {item.date} : {item.skill[0].lower()}{item.skill[1:]}, lors de « {item.event} ».",
        )
        for item in request.skills
    ]
    advice = f"Pour un poste de {request.objective}, placez ces lignes dans une rubrique « Activités et engagements » et préparez un exemple concret à raconter en entretien."
    return CvLines(lines=lines, advice=advice, source="guided")


def _prompt(request: CvLinesRequest) -> str:
    skills = [item.model_dump() for item in request.skills]
    return (
        "Tu aides une femme à rédiger son CV en français. Pour CHAQUE compétence fournie, dans le même ordre, "
        "écris dans « line » la phrase exacte à copier dans le CV : elle commence par un verbe d'action, "
        "reprend la compétence et l'activité, et relie-la au métier visé en 25 mots maximum. "
        "C'est une activité collective chez Marthe, jamais un emploi : n'invente aucun chiffre, diplôme, durée ou résultat. "
        "Dans « advice », dis en une phrase dans quelle rubrique la placer (« Activités et engagements » ou "
        "« Expériences bénévoles ») et quoi raconter en entretien.\n"
        "Exemple pour le métier « Serveuse » et la compétence « Service des boissons » lors de « Fête du quartier » : "
        '{"lines":[{"skill":"Service des boissons","line":"Servi les boissons lors de la Fête du quartier chez Marthe (Marseille, juin 2026), '
        'en gardant le sourire et le rythme."}],"advice":"Placez-la dans « Activités et engagements » et racontez comment vous avez géré l\'affluence."}\n'
        f"Métier visé: {request.objective}\nCompétences: {json.dumps(skills, ensure_ascii=False)}"
    )


def _ai_lines(request: CvLinesRequest) -> CvLines | None:
    try:
        with httpx.Client(timeout=MODEL_TIMEOUT, trust_env=False) as client:
            response = client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": _prompt(request)}],
                    "stream": False,
                    "keep_alive": -1,
                    "format": CvLinesContent.model_json_schema(),
                    "options": {"num_ctx": 4096, "num_predict": 350, "temperature": 0},
                },
            )
            response.raise_for_status()
        content = CvLinesContent.model_validate_json(
            response.json()["message"]["content"]
        )
    except httpx.HTTPError, KeyError, TypeError, ValidationError:
        return None
    if len(content.lines) != len(request.skills):
        return None
    # The model only writes the wording; skill names always come from the journey.
    lines = [
        CvLine(skill=item.skill, line=line.line)
        for item, line in zip(request.skills, content.lines)
    ]
    return CvLines(lines=lines, advice=content.advice, source="ai")


def generate_lines(request: CvLinesRequest) -> CvLines:
    if DEMO_MODE:
        time.sleep(DEMO_DELAY)
        written = demo_cv_lines(
            request.objective, [item.skill for item in request.skills]
        )
        return CvLines(**written, source="ai") if written else guided_lines(request)
    return _ai_lines(request) or guided_lines(request)
