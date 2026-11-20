from datetime import date
from io import BytesIO

from openpyxl import Workbook, load_workbook

import store
from funding import backup
from funding.excel import read_tracker
from funding.routes import router as funding_router
from funding.workbook import write_tracker
from test_store import client_as  # noqa: F401  (pytest fixture)

HEADER = ["Objet", "Contact", "Type", "Historique", "Nom", "Mail", "Tél"]


def tracker(rows: list[list], roadmap: list[list] | None = None) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Retroplanning"
    for row in [HEADER, *rows]:
        sheet.append(row)
    if roadmap is not None:
        tasks = workbook.create_sheet("feuille de route ")
        for row in [["", "Source", "Cadre", "Tâche", "Contact", "Date"], *roadmap]:
            tasks.append(row)
    content = BytesIO()
    workbook.save(content)
    return content.getvalue()


def row(name="", kind="", **cells) -> list:
    """A Retroplanning row; cells are given by column letter (H, J, K, …)."""
    values = [""] * 15
    values[2], values[4] = kind, name
    for letter, value in cells.items():
        values[ord(letter) - ord("A")] = value
    return values


def test_rows_without_a_name_continue_the_funder_above():
    content = tracker(
        [
            row("RAJA", "Fondation", H="15 000 €", K="Prioritaire à traiter"),
            row(H="2 500 €", J="Date de clôture : 01/11/2026"),
            row(kind="Fondation MACIF", A="Habitat, santé"),
        ]
    )
    raja, macif = read_tracker(content)
    assert raja["amount"] == "15 000 €\n2 500 €"
    assert raja["status"] == "priority" and raja["deadline"] == ""
    assert macif["name"] == "Fondation MACIF" and macif["type"] == ""
    assert macif["status"] == "qualify" and macif["purpose"] == "Habitat, santé"


def test_reads_dates_and_statuses_from_free_text():
    content = tracker(
        [
            row("FSE", J="Date de clôture  : 01/11/2026", K="A traiter en septembre"),
            row("DAPAT", J="jusqu’au 30 septembre 2026", K="Clôturé sans date"),
            row("OCIRP", J=date(2026, 9, 14), K="Candidature envoyée"),
            row("Logement", D="Véro doit envoyer les pièces", K="Presque validés"),
            row("Femmes", D="dossier déposé le 16/10", K="Clôturé sans date"),
        ]
    )
    cards = {card["name"]: card for card in read_tracker(content)}
    assert cards["FSE"]["deadline"] == "2026-11-01"
    assert cards["DAPAT"]["deadline"] == "2026-09-30"
    assert cards["OCIRP"]["deadlineNote"] == "2026-09-14"
    statuses = {name: card["status"] for name, card in cards.items()}
    assert statuses == {
        "FSE": "todo",
        "DAPAT": "closed",
        "OCIRP": "submitted",
        "Logement": "validated",
        "Femmes": "submitted",
    }


def test_roadmap_tasks_join_the_funder_they_name():
    content = tracker(
        [row("Fondation Laforêt"), row("BNP"), row("fondation BNP Paribas")],
        [
            ["Caro ?", "Fondation La forêt", "AAP ouvert", "Candidater", "", "Juillet"],
            ["", "", "", "Gros enjeu", "", ""],
            ["Véro", "BNP", "", "Relancer", "", date(2026, 9, 1)],
            ["Caro", "Pistes non traitées", "", "Tout vérifier", "", ""],
        ],
    )
    laforet, bnp, paribas = read_tracker(content)
    [task] = laforet["tasks"]
    assert (task["owner"], task["text"], task["due"]) == (
        "Caro",
        "Candidater (Juillet)",
        "",
    )
    assert laforet["owner"] == "Caro" and laforet["notes"] == "AAP ouvert\nGros enjeu"
    assert [task["due"] for task in bnp["tasks"]] == ["2026-09-01"]
    assert paribas["tasks"] == []


def test_only_the_team_imports_and_reads_funders(client_as):  # noqa: F811
    team = client_as("equipe")
    team.app.include_router(funding_router)
    files = {"file": ("suivi.xlsx", tracker([row("FSE")]))}
    response = team.post("/api/funders/import", files=files)
    assert [card["name"] for card in response.json()["funders"]] == ["FSE"]
    bad = team.post("/api/funders/import", files={"file": ("a.xlsx", b"texte")})
    assert bad.status_code == 422
    store.save_document("funders", [{"id": "a", "name": "FSE"}])
    resident = client_as("residents")
    assert resident.post("/api/funders/import", files=files).status_code == 403
    assert resident.get("/api/store/funders").json() == {"value": []}
    assert resident.put("/api/store/funders", json=[]).status_code == 403


def test_the_site_file_reads_back_exactly():
    content = tracker(
        [
            row("Fondation logement", K="Prioritaire"),
            row("Fondation pour le logement", "Fondation", H="Essaimage"),
            row(H="Hors AAP"),
        ]
    )
    funders = read_tracker(content)
    funders[0] |= {"status": "submitted", "owner": "Caro", "deadline": "2026-11-01"}
    funders[0]["color"] = "rose"
    task = {"text": "Envoyer", "owner": "Véro", "due": "2026-09-01", "done": True}
    funders[1] |= {"notes": "=SOMME(A1)", "tasks": [{"id": "t1", **task}]}
    again = read_tracker(write_tracker(funders))
    # Task ids are not kept; the funder ids are, so tasks find their funder.
    assert [{**item, "id": "t1"} for item in again[1]["tasks"]] == funders[1]["tasks"]
    assert again == [funders[0], {**funders[1], "tasks": again[1]["tasks"]}]
    assert again[1]["amount"] == "Essaimage\nHors AAP"
    sheet = load_workbook(BytesIO(write_tracker(funders)))["Retroplanning"]
    assert sheet["A2"].fill.fgColor.rgb.endswith("FDE2E7")
    assert sheet["A3"].fill.fill_type is None


def test_only_the_team_saves_the_excel_file(client_as):  # noqa: F811
    team = client_as("equipe")
    team.app.include_router(funding_router)
    response = team.post("/api/funders/export", json=[{"id": "a", "name": "FSE"}])
    assert response.status_code == 200
    assert [card["name"] for card in read_tracker(response.content)] == ["FSE"]
    resident = client_as("residents")
    assert resident.post("/api/funders/export", json=[]).status_code == 403


def test_each_team_save_keeps_a_copy_of_the_day(client_as, monkeypatch):  # noqa: F811
    team = client_as("equipe")
    team.app.include_router(funding_router)
    funders = [{"id": "a", "name": "FSE", "status": "priority", "tasks": []}]
    assert team.put("/api/store/funders", json=funders).status_code == 200
    assert team.put("/api/store/events", json=[]).status_code == 200
    [day] = team.get("/api/funders/backups").json()["days"]
    copy = team.get(f"/api/funders/backups/{day}")
    assert read_tracker(copy.content)[0]["status"] == "priority"
    assert team.get("/api/funders/backups/2020-01-01").status_code == 404
    assert team.get("/api/funders/backups/..%2Fsecret").status_code in (404, 422)
    resident = client_as("residents")
    assert resident.get("/api/funders/backups").status_code == 403
    assert resident.get(f"/api/funders/backups/{day}").status_code == 403
    assert resident.get(f"/api/store/funders@{day}").status_code == 422


def test_only_the_last_days_are_kept(client_as, monkeypatch):  # noqa: F811
    monkeypatch.setattr(backup, "KEEP", 2)
    for day in ("2026-01-01", "2026-01-02", "2026-01-03"):
        store.save_document(f"funders@{day}", [])
    backup.save_copy([{"id": "a"}])
    days = backup.copy_days()
    assert len(days) == 2 and "2026-01-01" not in days and "2026-01-02" not in days
