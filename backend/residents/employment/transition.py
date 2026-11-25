"""Conservative, explicit guidance for a technical CV targeting kitchen work."""

import re

from .models import EmploymentContext, EmploymentPlan, PlanStep

TECH = r"\b(python|javascript|typescript|react|sql|software|developer|développeur|développeuse|sviluppatore|sviluppatrice|informatique|informatica|ingénieur logiciel|git|docker)\b"
KITCHEN = (
    r"\b(cuisin\w*|commis|chef|restauration|cook|kitchen|ristorazione|cuoco|cucina)\b"
)


def technical_to_kitchen(context: EmploymentContext, text: str) -> bool:
    return bool(
        re.search(TECH, text, re.IGNORECASE)
        and re.search(KITCHEN, context.objective, re.IGNORECASE)
    )


def transition_plan(context: EmploymentContext, text: str) -> EmploymentPlan:
    evidence = list(dict.fromkeys(re.findall(TECH, text, re.IGNORECASE)))[:5]
    return EmploymentPlan(
        source="guided",
        summary=f"Votre CV contient des éléments techniques ({', '.join(evidence)}). Votre objectif « {context.objective} » demande de distinguer ces acquis des compétences de cuisine. Ces mentions techniques ne prouvent ni expérience en brigade ni qualification culinaire. Si vous avez aussi une expérience en cuisine, faites-la préciser et vérifier.",
        strengths=[
            f"Éléments effectivement repérés dans le CV : {', '.join(evidence)}.",
            "Piste à explorer : relier un exemple réel de résolution de problème technique à l'apprentissage de nouvelles tâches. Ce transfert reste à démontrer.",
            *[
                f"Parcours Marthe, distinct du CV : {skill[:180]}"
                for skill in context.acquired_skills[:2]
            ],
        ],
        gaps=[
            "À vérifier : pratique de la préparation des aliments, de l'hygiène et du travail en brigade. Le bagage technique ne suffit pas à les établir.",
            "Distinguer cuisine personnelle, atelier ponctuel et emploi en restauration ; ne pas les présenter comme équivalents.",
        ],
        cv_suggestions=[
            f"Titre possible : « Projet de reconversion vers {context.objective} » ; ne pas remplacer vos anciens postes techniques par un poste de cuisine.",
            "Conserver vos expériences réelles et expliquer votre motivation pour ce changement de métier.",
            "Ajouter une expérience culinaire uniquement si elle a réellement eu lieu, en précisant son contexte et ses tâches.",
        ],
        steps=[
            PlanStep(
                title="Faire le point",
                action="Avec votre accompagnatrice, séparer acquis techniques, expériences culinaires éventuelles et compétences à apprendre.",
                timeframe="Cette semaine",
            ),
            PlanStep(
                title="Découvrir le travail en cuisine",
                action="Contacter un atelier ou un professionnel pour explorer une séance découverte ou une immersion encadrée, selon les possibilités.",
                timeframe="Sous 2 semaines",
            ),
            PlanStep(
                title="Construire la transition",
                action="Comparer des offres débutantes et les formations possibles ; vérifier les prérequis avec une conseillère avant de candidater.",
                timeframe="Après ce premier échange",
            ),
        ],
    )
