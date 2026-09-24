import json

import httpx
from pydantic import ValidationError

from .models import EmploymentContext, EmploymentPlan, PlanContent, PlanStep
from .transition import technical_to_kitchen, transition_plan

MODEL = "qwen2.5:0.5b"
OLLAMA_URL = "http://127.0.0.1:11435/api/chat"


def _guided_steps() -> list[PlanStep]:
    return [
        PlanStep(
            title="Clarifier le CV",
            action="Adapter le titre et les expériences au métier visé.",
            timeframe="Cette semaine",
        ),
        PlanStep(
            title="Choisir trois offres",
            action="Repérer les compétences demandées qui reviennent le plus souvent.",
            timeframe="Sous 10 jours",
        ),
        PlanStep(
            title="Préparer une candidature",
            action="Faire relire le CV puis envoyer une candidature adaptée.",
            timeframe="Sous 2 semaines",
        ),
    ]


def guided_plan(context: EmploymentContext, cv_text: str) -> EmploymentPlan:
    skills = context.acquired_skills[:3] or ["Expériences présentes dans le CV"]
    objective_found = context.objective.casefold() in cv_text.casefold()
    gap = (
        "Préciser dans le CV le métier recherché"
        if not objective_found
        else "Ajouter des résultats concrets aux expériences"
    )
    return EmploymentPlan(
        source="guided",
        summary=f"Un plan prudent vers « {context.objective} », construit à partir des éléments lisibles du CV et des expériences documentées chez Marthe.",
        strengths=skills,
        gaps=[gap, "Vérifier avec une conseillère les prérequis des offres visées"],
        cv_suggestions=[
            f"Ajouter un titre clair : « {context.objective} »",
            "Décrire chaque expérience avec une action, une compétence et un résultat",
        ],
        steps=_guided_steps(),
    )


def _prompt(context: EmploymentContext, cv_text: str) -> str:
    return (
        "Tu aides une femme à préparer un retour à l'emploi en France. Analyse uniquement les données fournies. "
        "N'invente aucun diplôme, emploi, durée, niveau ou résultat. Donne des conseils simples, bienveillants et "
        "Distingue le métier souhaité de l'expérience prouvée. Un objectif n'est jamais une compétence acquise. "
        "Si le CV vient d'un autre secteur, explique la reconversion, les acquis transférables à vérifier et les apprentissages nécessaires. "
        "Ne transforme pas un atelier en emploi, ni un développeur en cuisinier expérimenté. "
        "concrets. Les étapes doivent être réalisables et datées relativement. Réponds uniquement selon le schéma JSON.\n"
        f"Contexte: {context.model_dump_json()}\nCV:\n{cv_text}"
    )


def generate_plan(context: EmploymentContext, cv_text: str) -> EmploymentPlan:
    if technical_to_kitchen(context, cv_text):
        return transition_plan(context, cv_text)
    try:
        with httpx.Client(timeout=120, trust_env=False) as client:
            response = client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "messages": [
                        {"role": "user", "content": _prompt(context, cv_text)}
                    ],
                    "stream": False,
                    "format": PlanContent.model_json_schema(),
                    "options": {"num_ctx": 4096, "num_predict": 900, "temperature": 0},
                },
            )
            response.raise_for_status()
        content = PlanContent.model_validate_json(response.json()["message"]["content"])
        return EmploymentPlan(**content.model_dump(), source="ai")
    except httpx.HTTPError, KeyError, TypeError, ValidationError, json.JSONDecodeError:
        return guided_plan(context, cv_text)
