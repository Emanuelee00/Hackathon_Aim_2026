"""Upcoming events related to what a CV and the job sought talk about."""

import re

from ranking import STOPWORDS, stems

from .models import CvEvent, CvProposal

# Words common to most CVs or events that would link everything to everything.
IGNORED = STOPWORDS | {
    "chez",
    "marthe",
    "cette",
    "sans",
    "plus",
    "tout",
    "tous",
    "toute",
    "elle",
    "elles",
    "être",
    "faire",
    "fait",
    "expérience",
    "expériences",
    "compétences",
    "objectif",
    "découvrir",
    "partager",
    "partage",
    "quartier",
    "ouvert",
    "ouverte",
    "personnes",
    "équipe",
    "organiser",
    "organisation",
    "projet",
    "voisines",
    "habitants",
    "habitantes",
}


def event_links(event: CvEvent, profile_text: str) -> list[str]:
    """Words of the event that the CV or the job sought also mention."""
    profile = stems(profile_text)
    text = f"{event.category} {event.title} {event.description} {event.opportunity}"
    links = []
    for word in re.findall(r"\w{4,}", text.casefold()):
        stem = word[:6]
        if word in IGNORED or word in links:
            continue
        if any(stem.startswith(other) or other.startswith(stem) for other in profile):
            links.append(word)
    return links


def cv_proposals(events: list[CvEvent], profile_text: str) -> list[CvProposal]:
    linked = [(event, event_links(event, profile_text)) for event in events]
    linked = sorted(
        (item for item in linked if item[1]), key=lambda item: -len(item[1])
    )
    return [
        CvProposal(
            event_id=event.id,
            reasons=links[:3],
            rationale=f"Votre CV et le métier que vous visez parlent de {', '.join(links[:3])} : cet événement est en lien direct.",
            benefit=event.opportunity or event.description,
            vigilance="Vérifiez vos disponibilités avec l’équipe avant de vous inscrire.",
        )
        for event, links in linked[:3]
    ]
