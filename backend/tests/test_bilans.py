from io import BytesIO

from features.equipe import bilans
from openpyxl import load_workbook
from test_store import client_as  # noqa: F401  (pytest fixture)


def clients(client_as):  # noqa: F811
    trio = client_as("equipe"), client_as("partenaires"), client_as("residents")
    for client in trio:
        client.app.include_router(bilans.router)
    return trio


def test_questions_are_unique_and_no_question_asks_for_a_name():
    for structure in bilans.STRUCTURES:
        ids = [q["id"] for s in bilans.sections(structure) for q in s["questions"]]
        assert len(ids) == len(set(ids)), structure["id"]
        assert all(
            q["type"] in ("number", "text")
            for s in bilans.sections(structure)
            for q in s["questions"]
        )
        assert not any(
            "nom" == q["label"].lower()
            for s in bilans.sections(structure)
            for q in s["questions"]
        )


def test_an_association_only_sees_and_fills_its_own_bilan(client_as):  # noqa: F811
    team, asso, resident = clients(client_as)
    seen = asso.get("/api/bilans").json()
    assert seen["mine"] == "benenova"
    assert [s["id"] for s in seen["structures"]] == ["benenova"]
    answers = {"benevoles": 12, "dames": 3, "recit": "  Un bon mois.  ", "voisins": ""}
    saved = asso.put("/api/bilans/benenova/2026-11", json={"answers": answers})
    assert saved.status_code == 200
    assert saved.json()["answers"] == {
        "benevoles": 12,
        "dames": 3,
        "recit": "Un bon mois.",
    }
    assert asso.put("/api/bilans/has/2026-11", json={"answers": {}}).status_code == 403
    assert resident.get("/api/bilans").json()["structures"] == []
    assert (
        resident.put("/api/bilans/benenova/2026-11", json={"answers": {}}).status_code
        == 403
    )
    # Saving again replaces the month; the team sees every structure.
    asso.put("/api/bilans/benenova/2026-11", json={"answers": {"benevoles": 14}})
    everything = team.get("/api/bilans").json()
    assert len(everything["structures"]) == 6 and everything["mine"] is None
    assert [e["answers"] for e in everything["entries"]] == [{"benevoles": 14}]


def test_answers_are_checked(client_as):  # noqa: F811
    team, _, _ = clients(client_as)
    for answers in (
        {"inconnue": 1},
        {"dames": -1},
        {"dames": "trois"},
        {"dames": True},
        {"recit": "x" * 3001},
    ):
        assert (
            team.put("/api/bilans/has/2026-11", json={"answers": answers}).status_code
            == 422
        ), answers
    assert team.put("/api/bilans/has/2026-13", json={"answers": {}}).status_code == 422
    assert (
        team.put("/api/bilans/inconnue/2026-11", json={"answers": {}}).status_code
        == 403
    )


def test_the_team_downloads_the_year_with_common_totals(client_as):  # noqa: F811
    team, asso, _ = clients(client_as)
    asso.put(
        "/api/bilans/benenova/2026-10", json={"answers": {"dames": 2, "personnes": 30}}
    )
    asso.put("/api/bilans/benenova/2026-11", json={"answers": {"dames": 3}})
    team.put("/api/bilans/has/2026-11", json={"answers": {"dames": 5, "hebergees": 28}})
    assert asso.get("/api/bilans/excel?annee=2026").status_code == 403
    response = team.get("/api/bilans/excel?annee=2026")
    assert response.status_code == 200
    book = load_workbook(BytesIO(response.content))
    rows = {
        row[0]: row
        for row in book["Indicateurs communs"].iter_rows(values_only=True)
        if row and row[0]
    }
    dames = rows["Dames hébergées Chez Marthe ayant participé à vos activités"]
    assert dames[-1] == 10
    assert rows["Bilans remplis (mois)"][1:7] == (0, 1, 0, 0, 0, 2)
    assert len(book.sheetnames) == 7
