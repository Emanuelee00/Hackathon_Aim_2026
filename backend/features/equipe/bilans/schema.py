"""Structure constants and validation for monthly structure reports."""

import re
from typing import Any

from core import store
from fastapi import HTTPException

from features.accounts.models import User

KEY = "bilans"
MONTH = re.compile(r"^(20[2-3]\d)-(0[1-9]|1[0-2])$")
MAX_TEXT = 3000
MAX_NUMBER = 1_000_000
MONTHS = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
]
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def n(id_: str, label: str, help_: str = "") -> dict:
    return {"id": id_, "label": label, "type": "number", "help": help_}


def t(id_: str, label: str, help_: str = "") -> dict:
    return {"id": id_, "label": label, "type": "text", "help": help_}


# Les mêmes pour toutes les structures : les nombres s'additionnent dans « Indicateurs communs ».
COMMON = [
    {
        "title": "Indicateurs communs",
        "questions": [
            n(
                "personnes",
                "Personnes accueillies ou touchées ce mois-ci",
                "Toutes activités confondues, estimation si besoin.",
            ),
            n(
                "dames",
                "Dames hébergées Chez Marthe ayant participé à vos activités",
                "Un nombre, sans nom.",
            ),
            t(
                "dames_observations",
                "Changements observés chez les dames, retours",
                "Sans nom ni détail permettant de reconnaître une personne.",
            ),
            n("voisins", "Voisins et passages spontanés (estimation)"),
            t(
                "voisinage",
                "Nature des échanges avec le voisinage, nouvelles connexions",
            ),
        ],
    },
    {
        "title": "Liens entre les structures du lieu",
        "questions": [
            n(
                "orientees_vers",
                "Personnes que vous avez orientées vers une autre structure du lieu",
            ),
            n(
                "orientees_par",
                "Personnes orientées vers vous par une autre structure du lieu",
            ),
            t("echanges", "Échanges et projets avec les autres structures"),
        ],
    },
    {
        "title": "Le mois en quelques lignes",
        "questions": [
            t(
                "recit",
                "Ce qui s’est passé ce mois-ci",
                "Ambiance, dynamique, densité du mois.",
            ),
            t("marquants", "Moments marquants, anecdotes, verbatims"),
            t("fonctionne", "Ce qui fonctionne bien"),
            t("ameliorer", "Ce qui est à améliorer"),
            t("besoins", "Besoins ou décisions à prendre"),
        ],
    },
]

STRUCTURES: list[dict[str, Any]] = [
    {
        "id": "chez-marthe",
        "name": "Chez Marthe",
        "accounts": (),
        "sections": [
            {
                "title": "Gouvernance et pilotage",
                "questions": [
                    n("comites", "Comités opérationnels"),
                    n("comites_participants", "Participants aux comités"),
                    n("reunions", "Réunions (partenaires, institutions…)"),
                    n("presse", "Rencontres presse"),
                    n("partenariats", "Rencontres partenariales"),
                    n("communication", "Actions de communication"),
                ],
            },
            {
                "title": "Visiteurs du lieu",
                "questions": [
                    n(
                        "visiteurs",
                        "Visiteurs (total)",
                        "D’après le carnet de l’accueil.",
                    ),
                    n("v_associations", "dont associations"),
                    n("v_coworking", "dont coworking"),
                    n("v_voisinage", "dont voisinage"),
                    n("v_institutions", "dont partenaires institutionnels"),
                    n("v_entreprises", "dont entreprises / séminaires"),
                    n("v_curiosite", "dont curiosité / visite spontanée"),
                    n("connu_bouche", "Ont connu le lieu par le bouche-à-oreille"),
                    n("connu_reseaux", "… par les réseaux sociaux"),
                    n("connu_medias", "… par les médias"),
                    n("connu_passant", "… en passant devant le bâtiment"),
                    t(
                        "motivations",
                        "Pourquoi viennent-ils ?",
                        "Curiosité, bénévolat, activité, évènement…",
                    ),
                ],
            },
        ],
    },
    {
        "id": "has",
        "name": "Habitat Alternatif Social (HAS)",
        "accounts": ("has", "habitat alternatif social"),
        "sections": [
            {
                "title": "Hébergement (des nombres, jamais de noms)",
                "questions": [
                    n("hebergees", "Dames hébergées ce mois-ci"),
                    n("arrivees", "Arrivées"),
                    n("departs", "Départs"),
                    n("departs_logement", "dont départs vers un logement durable"),
                    n("orientees_structure", "Arrivées orientées par une structure"),
                    n("demande_perso", "Arrivées sur demande personnelle"),
                    n("avec_enfants", "Dames avec enfants à charge"),
                    n("enfants", "Enfants hébergés"),
                    n(
                        "deja_hebergees",
                        "Arrivées déjà hébergées ailleurs qu’en urgence",
                    ),
                    n(
                        "rue_mois",
                        "Temps moyen passé à la rue avant l’arrivée (en mois)",
                    ),
                    t("causes_depart", "Causes de départ", "En général, sans nom."),
                    t(
                        "demarches",
                        "Démarches et initiatives marquantes",
                        "Emploi, formation, santé, logement… sans nom.",
                    ),
                ],
            },
        ],
    },
    {
        "id": "just",
        "name": "JUST",
        "accounts": ("just",),
        "sections": [
            {
                "title": "Hébergement des étudiantes (des nombres, jamais de noms)",
                "questions": [
                    n("etudiantes", "Étudiantes hébergées ce mois-ci"),
                    n("arrivees", "Arrivées"),
                    n("departs", "Départs"),
                    n(
                        "etudiantes_activites",
                        "Étudiantes ayant participé à une activité du lieu",
                    ),
                    t("raisons", "Raisons de l’hébergement", "En général, sans nom."),
                    t("retours", "Leurs retours sur la vie du lieu"),
                ],
            },
        ],
    },
    {
        "id": "sista4good",
        "name": "Sista4good (les Sistas)",
        "accounts": ("sista4good", "sister4good", "les sistas"),
        "sections": [
            {
                "title": "Activités dans la chapelle",
                "questions": [
                    n("evenements", "Évènements organisés (soirées Sista…)"),
                    n("evenements_participants", "Participants aux évènements"),
                    n("concerts", "Concerts"),
                    n("concerts_participants", "Participants aux concerts"),
                    n("ateliers", "Ateliers et rencontres"),
                    n("ateliers_participants", "Participants aux ateliers"),
                    n("chantiers", "Chantiers participatifs"),
                    n("chantiers_participants", "Participants aux chantiers"),
                ],
            },
            {
                "title": "Coworking",
                "questions": [
                    n("cw_inscriptions", "Nouvelles inscriptions"),
                    n("cw_actives", "Utilisatrices actives"),
                    n("cw_occupation", "Taux d’occupation estimé (%)"),
                    n("cw_demandes", "Visites et demandes d’information"),
                ],
            },
        ],
    },
    {
        "id": "cantines",
        "name": "Les Petites Cantines",
        "accounts": ("les petites cantines", "petites cantines"),
        "sections": [
            {
                "title": "La cantine",
                "questions": [
                    n("ouvertures", "Ouvertures ce mois-ci"),
                    n("convives", "Convives (total)"),
                    n("nouveaux", "Nouveaux participants"),
                    n("dames_repas", "Dames ayant pris un repas"),
                    n("dames_ateliers", "Dames ayant participé à un atelier cuisine"),
                    t("motivations", "Motivations des participants"),
                    t("connu", "Comment ils ont connu les Petites Cantines"),
                ],
            },
        ],
    },
    {
        "id": "benenova",
        "name": "Bénénova",
        "accounts": ("benenova", "bénénova"),
        "sections": [
            {
                "title": "Le bénévolat",
                "questions": [
                    n("ouvertures", "Permanences ce mois-ci"),
                    n("benevoles", "Bénévoles accueillis"),
                    n("interesses", "Nouvelles personnes intéressées par le bénévolat"),
                    n("dames_engagement", "Dames ayant exprimé l’envie de s’engager"),
                    t("motivations", "Leurs motivations"),
                    t("connu", "Comment elles ont découvert Bénénova"),
                ],
            },
        ],
    },
]
BY_ID = {structure["id"]: structure for structure in STRUCTURES}


def sections(structure: dict) -> list[dict]:
    return [*structure["sections"], *COMMON]


def questions(structure: dict) -> dict[str, dict]:
    return {q["id"]: q for section in sections(structure) for q in section["questions"]}


def own_structure(user: User) -> str | None:
    """Une association se connecte avec un compte au nom de sa structure."""
    name = user.name.strip().casefold()
    return next((s["id"] for s in STRUCTURES if name in s["accounts"]), None)


def visible(user: User) -> list[dict]:
    if user.role == "equipe":
        return STRUCTURES
    own = own_structure(user) if user.role == "partenaires" else None
    return [BY_ID[own]] if own else []


def public(structure: dict) -> dict:
    return {
        "id": structure["id"],
        "name": structure["name"],
        "sections": sections(structure),
    }


def clean_answers(structure: dict, answers: Any) -> dict:
    if not isinstance(answers, dict):
        raise HTTPException(422, "Réponses invalides.")
    known = questions(structure)
    cleaned: dict[str, Any] = {}
    for key, value in answers.items():
        question = known.get(key)
        if not question:
            raise HTTPException(422, "Question inconnue.")
        if value is None or value == "":
            continue
        if question["type"] == "number":
            if (
                isinstance(value, bool)
                or not isinstance(value, int | float)
                or not 0 <= value <= MAX_NUMBER
            ):
                raise HTTPException(
                    422, f"« {question['label']} » : un nombre positif est attendu."
                )
            cleaned[key] = (
                int(value) if float(value).is_integer() else round(float(value), 1)
            )
        else:
            if not isinstance(value, str) or len(value) > MAX_TEXT:
                raise HTTPException(
                    422,
                    f"« {question['label']} » : texte trop long ({MAX_TEXT} caractères au plus).",
                )
            if value.strip():
                cleaned[key] = value.strip()
    return cleaned


def entries() -> list[dict]:
    return store.load_document(KEY) or []  # type: ignore[arg-type]
