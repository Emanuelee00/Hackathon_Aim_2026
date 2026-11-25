import io

from equipe import prospection
from openpyxl import load_workbook
from test_store import client_as  # noqa: F401  (pytest fixture)

PROSPECT = {
    "id": "r01",
    "name": "Fondation de Marseille",
    "status": "À contacter",
    "contact": "Alexis",
}
SHEETS = {
    "sheets": [
        {
            "title": "Répertoire financeurs",
            "columns": ["Financeur / dispositif", "Statut de prospection"],
            "rows": [
                ["Fondation de Marseille", "À contacter"],
                ["Fondation Macif", "À explorer"],
            ],
        },
        {"title": "Appels et échéances", "columns": ["Appel / dispositif"], "rows": []},
    ]
}


def test_the_prospection_tables_are_kept_for_the_team_only(client_as):  # noqa: F811
    team, resident, volunteer = (
        client_as("equipe"),
        client_as("residents"),
        client_as("benevoles"),
    )
    for key in (
        "prospects",
        "prospectCalls",
        "fundingStrategy",
        "euCalls",
        "frCalls",
        "patrons",
    ):
        assert (
            team.get(f"/api/store/{key}").status_code == 404
        )  # the page then starts from the team's file
        assert team.put(f"/api/store/{key}", json=[PROSPECT]).status_code == 200
        assert team.get(f"/api/store/{key}").json()["value"] == [PROSPECT]
        assert resident.get(f"/api/store/{key}").json()["value"] == []
        assert volunteer.get(f"/api/store/{key}").json()["value"] == []
        assert resident.put(f"/api/store/{key}", json=[]).status_code == 403


def test_the_tables_go_back_to_excel_one_sheet_each(client_as):  # noqa: F811
    team, resident = client_as("equipe"), client_as("residents")
    for client in (team, resident):
        client.app.include_router(prospection.router)
    answer = team.post("/api/prospection/excel", json=SHEETS)
    assert answer.status_code == 200
    assert "Financeurs%20potentiels" in answer.headers["content-disposition"]
    book = load_workbook(io.BytesIO(answer.content))
    assert book.sheetnames == ["Répertoire financeurs", "Appels et échéances"]
    rows = list(book["Répertoire financeurs"].iter_rows(values_only=True))
    assert rows == [
        ("Financeur / dispositif", "Statut de prospection"),
        ("Fondation de Marseille", "À contacter"),
        ("Fondation Macif", "À explorer"),
    ]
    assert resident.post("/api/prospection/excel", json=SHEETS).status_code == 403
    assert team.post("/api/prospection/excel", json={"sheets": []}).status_code == 422
