"""Handing a question off to the team: every agent except the team's own can do it."""

import re

from .llm import Context, Tool
from .models import Question

EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
SUMMARY = {
    "type": "string",
    "description": "La demande, compréhensible sans la conversation : "
    "quoi, quel espace, quand, combien de personnes.",
}


def save_question(context: Context, agent: str, name: str, email: str, summary: str):
    if context.handoff:
        return f"Déjà transmis sous la référence Q-{context.handoff}."
    question = Question(
        agent=agent,
        name=name[:120],
        email=email[:254],
        summary=summary[:2000],
        transcript=context.transcript,
    )
    context.db.add(question)
    context.db.commit()
    context.handoff = question.id
    return f"Transmis à l’équipe sous la référence Q-{question.id}."


def from_visitor(arguments: dict, context: Context) -> str:
    name = str(arguments.get("nom", "")).strip()
    email = str(arguments.get("email", "")).strip()
    summary = str(arguments.get("resume", "")).strip()
    if not (name and summary and EMAIL.match(email)):
        return "Il manque le nom, un e-mail valide ou le résumé : demande-les."
    return save_question(context, "renseignements", name, email, summary)


def account_hand_off(agent: str) -> Tool:
    """Signed-in people: name and e-mail come from their account, not from the chat."""

    def run(arguments: dict, context: Context) -> str:
        summary = str(arguments.get("resume", "")).strip()
        if not summary:
            return "Il manque le résumé de la demande."
        user = context.user
        return save_question(context, agent, user.name, user.email, summary)

    return Tool(
        name="transmettre_a_equipe",
        description="Transmet une demande à l’équipe de Chez Marthe, qui répondra "
        "par e-mail à l’adresse du compte.",
        parameters={
            "type": "object",
            "properties": {"resume": SUMMARY},
            "required": ["resume"],
        },
        run=run,
    )


VISITOR_HAND_OFF = Tool(
    name="transmettre_a_equipe",
    description="Transmet la question à l’équipe de Chez Marthe, qui répondra par e-mail.",
    parameters={
        "type": "object",
        "properties": {
            "nom": {"type": "string", "description": "Nom ou structure."},
            "email": {"type": "string", "description": "Adresse pour la réponse."},
            "resume": SUMMARY,
        },
        "required": ["nom", "email", "resume"],
    },
    run=from_visitor,
)
