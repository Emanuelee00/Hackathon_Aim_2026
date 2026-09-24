"""Information desk: answers from the knowledge file, hands everything else to the team."""

import re
from pathlib import Path

from .llm import Agent, Context, Tool
from .models import Question

KNOWLEDGE = Path(__file__).parent / "knowledge" / "renseignements.md"
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

INSTRUCTIONS = """Tu es l’agent de renseignements de Chez Marthe, sur le site public.
Des visiteurs, associations et organisateurs te demandent s’ils peuvent faire
quelque chose dans le lieu.

- Réponds dans la langue de la personne, en 2 à 4 phrases, avec chaleur et clarté.
- Appuie-toi uniquement sur les informations ci-dessous. N’invente jamais un tarif,
  une règle, une disponibilité ni une date. Tu ne connais pas le calendrier.
- Si les informations permettent de répondre, réponds en citant la règle concernée
  et rappelle que la décision finale revient à l’équipe, en comité le vendredi.
- Si elles ne suffisent pas, ou si la demande touche une exception, une date
  précise ou un cas particulier, propose de transmettre la question à l’équipe.
  Demande alors seulement un nom (ou une structure) et une adresse e-mail.
  Quand tu as les deux et que la personne est d’accord, appelle
  transmettre_a_equipe, puis donne-lui la référence.
- Pour réserver concrètement, oriente vers le formulaire « Faire une demande »
  de la page d’accueil.
- Ne parle jamais des résidentes en particulier. Si la question n’a rien à voir
  avec Chez Marthe, ramène poliment la conversation au lieu.

Informations sur le lieu :
"""


def instructions() -> str:
    return INSTRUCTIONS + KNOWLEDGE.read_text(encoding="utf-8")


def hand_off(arguments: dict, context: Context) -> str:
    name = str(arguments.get("nom", "")).strip()[:120]
    email = str(arguments.get("email", "")).strip()[:254]
    summary = str(arguments.get("resume", "")).strip()[:2000]
    if context.handoff:
        return f"Déjà transmis sous la référence Q-{context.handoff}."
    if not (name and summary and EMAIL.match(email)):
        return "Il manque le nom, un e-mail valide ou le résumé : demande-les."
    question = Question(
        agent="renseignements",
        name=name,
        email=email,
        summary=summary,
        transcript=context.transcript,
    )
    context.db.add(question)
    context.db.commit()
    context.handoff = question.id
    return f"Transmis à l’équipe sous la référence Q-{question.id}."


HAND_OFF = Tool(
    name="transmettre_a_equipe",
    description="Transmet la question à l’équipe de Chez Marthe, qui répondra par e-mail.",
    parameters={
        "type": "object",
        "properties": {
            "nom": {"type": "string", "description": "Nom ou structure."},
            "email": {"type": "string", "description": "Adresse pour la réponse."},
            "resume": {
                "type": "string",
                "description": "La demande, compréhensible sans la conversation : "
                "quoi, quel espace, quand, combien de personnes.",
            },
        },
        "required": ["nom", "email", "resume"],
    },
    run=hand_off,
)

AGENT = Agent(id="renseignements", instructions=instructions, tools=(HAND_OFF,))
