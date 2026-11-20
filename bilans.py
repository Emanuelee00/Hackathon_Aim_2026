"""« Bilans des structures » : chaque structure du lieu (Chez Marthe, HAS, JUST, les Sistas, les Petites Cantines,
Bénénova) remplit chaque mois un bilan court. Des questions communes à toutes, pour additionner (personnes accueillies,
dames qui participent, voisinage, liens entre associations, récit du mois), puis les questions propres à chacune.

Une association, connectée sur l'espace associations, ne voit et ne remplit que le sien ; l'équipe voit tout, remplit celui de
Chez Marthe (ou un autre à la place d'une structure) et télécharge l'année en Excel pour le bilan de juin.

Aucune question ne porte sur une personne nommée : pour l'hébergement (HAS, JUST), seulement des nombres du mois."""

import re
from datetime import UTC, datetime
from io import BytesIO
from typing import Annotated, Any
from urllib.parse import quote

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import Response
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

from accounts.models import User
from accounts.sessions import current_user, team_member
from core import store

router = APIRouter(prefix="/api/bilans")
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


@router.get("")
def read(user: Annotated[User, Depends(current_user)]) -> dict:
    """Les questions et les bilans que ce compte peut voir."""
    shown = visible(user)
    ids = {s["id"] for s in shown}
    return {
        "structures": [public(s) for s in shown],
        "entries": [e for e in entries() if e.get("structure") in ids],
        "mine": own_structure(user) if user.role == "partenaires" else None,
    }


@router.put("/{structure_id}/{month}")
def save(
    structure_id: str,
    month: str,
    user: Annotated[User, Depends(current_user)],
    answers: Annotated[dict, Body(embed=True)],
) -> dict:
    structure = BY_ID.get(structure_id)
    if not structure or structure not in visible(user):
        raise HTTPException(403, "Ce bilan n’est pas celui de votre structure.")
    if not MONTH.match(month):
        raise HTTPException(422, "Mois invalide.")
    entry = {
        "structure": structure_id,
        "month": month,
        "answers": clean_answers(structure, answers),
        "updatedAt": datetime.now(UTC).isoformat(timespec="seconds"),
        "by": user.name,
    }
    others = [
        e
        for e in entries()
        if (e.get("structure"), e.get("month")) != (structure_id, month)
    ]
    store.save_document(KEY, [*others, entry])  # type: ignore[arg-type]
    return entry


def workbook(year: int, saved: list[dict]) -> bytes:
    """Une feuille « Indicateurs communs » (l'année, par structure) puis une feuille par structure (une colonne par mois)."""
    book = Workbook()
    head = Font(bold=True, color="FFFFFF")
    fill = PatternFill("solid", fgColor="6B2C7E")
    wrap = Alignment(wrap_text=True, vertical="top")
    by_key = {(e["structure"], e["month"]): e.get("answers", {}) for e in saved}
    months = [f"{year}-{m:02d}" for m in range(1, 13)]

    summary = book.active
    summary.title = "Indicateurs communs"
    numbers = [
        q for section in COMMON for q in section["questions"] if q["type"] == "number"
    ]
    summary.append([f"Année {year}", *(s["name"] for s in STRUCTURES), "Total"])
    for question in numbers:
        values = [
            sum(by_key.get((s["id"], m), {}).get(question["id"], 0) for m in months)
            for s in STRUCTURES
        ]
        summary.append([question["label"], *values, sum(values)])
    summary.append([])
    summary.append(
        [
            "Bilans remplis (mois)",
            *(sum((s["id"], m) in by_key for m in months) for s in STRUCTURES),
        ]
    )

    for structure in STRUCTURES:
        page = book.create_sheet(
            structure["name"][:31].replace("(", "").replace(")", "")
        )
        page.append(
            [structure["name"], *(f"{MONTHS[i]} {year}" for i in range(12)), "Total"]
        )
        for section in sections(structure):
            page.append([section["title"]])
            page.cell(page.max_row, 1).font = Font(bold=True, color="6B2C7E")
            for question in section["questions"]:
                values = [
                    by_key.get((structure["id"], m), {}).get(question["id"], "")
                    for m in months
                ]
                total = (
                    sum(v for v in values if isinstance(v, int | float))
                    if question["type"] == "number"
                    else ""
                )
                page.append([question["label"], *values, total])
        page.column_dimensions["A"].width = 55
        for column in "BCDEFGHIJKLMN":
            page.column_dimensions[column].width = 22
        for row in page.iter_rows(min_row=2):
            for cell in row:
                cell.alignment = wrap
        page.freeze_panes = "B2"

    for page in book.worksheets:
        for cell in page[1]:
            cell.font, cell.fill = head, fill
    summary.column_dimensions["A"].width = 60
    output = BytesIO()
    book.save(output)
    return output.getvalue()


@router.get("/excel")
def export(
    _: Annotated[User, Depends(team_member)],
    annee: Annotated[int, Query(ge=2020, le=2039)],
) -> Response:
    name = quote(f"Bilans des structures {annee} - Chez Marthe.xlsx")
    saved = [e for e in entries() if str(e.get("month", "")).startswith(f"{annee}-")]
    return Response(
        workbook(annee, saved),
        media_type=XLSX,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{name}"},
    )
