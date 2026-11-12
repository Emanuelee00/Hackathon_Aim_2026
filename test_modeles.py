import io
import zipfile

import modeles
from test_store import client_as  # noqa: F401  (pytest fixture)

BODY = {
    "number": "2026-014",
    "date": "2026-11-10",
    "name": "Association Soleil & Co",
    "address": "12 rue des Lilas",
    "postal_code": "13001",
    "city": "Marseille",
    "nature": "Location de la Chapelle",
    "lines": [
        {"designation": "Chapelle, soirée", "quantity": 2, "unit_price": 150},
        {"designation": "Ménage", "quantity": 1, "unit_price": 40.5},
    ],
    "deposit": 100,
}


def teams(client_as):  # noqa: F811
    clients = client_as("equipe"), client_as("residents"), client_as(None)
    for client in clients:
        client.app.include_router(modeles.router)
    return clients


def test_totals_are_computed_by_the_server():
    totals = modeles.totals(modeles.Document(**BODY))
    assert totals["rows"] == [30000, 4050]
    assert (totals["total"], totals["deposit"], totals["due"]) == (34050, 10000, 24050)
    assert modeles.money(123456) == "1 234,56 €"


def test_quote_and_invoice_in_word_are_the_template_with_fields_replaced(client_as):  # noqa: F811
    team, _, _ = teams(client_as)
    for kind in ("devis", "facture"):
        answer = team.post(f"/api/modeles/{kind}.docx", json=BODY)
        assert answer.status_code == 200
        xml = (
            zipfile.ZipFile(io.BytesIO(answer.content))
            .read("word/document.xml")
            .decode()
        )
        assert "&lt;&lt;" not in xml  # no field left to fill
        for text in (
            "2026-014",
            "10/11/2026",
            "Soleil &amp; Co",
            "Chapelle, soirée",
            "Ménage",
            "13001 Marseille",
        ):
            assert text in xml
        assert "340,50" in xml
    assert "240,50" in xml  # invoice: total minus the deposit


def test_pdf_is_a_pdf(client_as):  # noqa: F811
    team, _, _ = teams(client_as)
    for kind in ("devis", "facture"):
        answer = team.post(f"/api/modeles/{kind}.pdf", json=BODY)
        assert answer.status_code == 200
        assert answer.content.startswith(b"%PDF")
        assert "attachment" in answer.headers["content-disposition"]


def test_only_the_team_can_create_and_the_input_is_checked(client_as):  # noqa: F811
    team, resident, anonymous = teams(client_as)
    assert resident.post("/api/modeles/devis.pdf", json=BODY).status_code == 403
    assert anonymous.post("/api/modeles/devis.pdf", json=BODY).status_code == 401
    assert team.post("/api/modeles/contrat.pdf", json=BODY).status_code == 404
    assert team.post("/api/modeles/devis.exe", json=BODY).status_code == 404
    assert (
        team.post("/api/modeles/devis.pdf", json={**BODY, "lines": []}).status_code
        == 422
    )
    negative = [{"designation": "x", "quantity": 1, "unit_price": -5}]
    assert (
        team.post(
            "/api/modeles/devis.pdf", json={**BODY, "lines": negative}
        ).status_code
        == 422
    )


PRICES = {
    "groups": [
        {
            "id": "chapelle",
            "name": "La Chapelle",
            "items": [{"id": "chapelle-1", "name": "Demi-journée", "price": 150}],
        },
        {
            "id": "autres",
            "name": "Autres",
            "items": [{"id": "menage", "name": "Ménage", "price": 40.5}],
        },
    ]
}


def test_price_list_is_saved_read_and_reset_by_the_team(client_as):  # noqa: F811
    team, resident, anonymous = teams(client_as)
    assert team.get("/api/modeles/tarifs").json() == {"groups": None}
    saved = team.put("/api/modeles/tarifs", json=PRICES)
    assert saved.status_code == 200
    assert (
        team.get("/api/modeles/tarifs").json()["groups"][1]["items"][0]["price"] == 40.5
    )
    assert team.delete("/api/modeles/tarifs").json() == {"groups": None}
    assert team.get("/api/modeles/tarifs").json() == {"groups": None}
    for client, code in ((resident, 403), (anonymous, 401)):
        assert client.get("/api/modeles/tarifs").status_code == code
        assert client.put("/api/modeles/tarifs", json=PRICES).status_code == code
        assert client.delete("/api/modeles/tarifs").status_code == code


def test_price_list_is_checked(client_as):  # noqa: F811
    team, _, _ = teams(client_as)
    bad_price = {
        "groups": [
            {"id": "a", "name": "A", "items": [{"id": "x", "name": "Y", "price": -1}]}
        ]
    }
    assert team.put("/api/modeles/tarifs", json=bad_price).status_code == 422
    bad_id = {"groups": [{"id": "a b", "name": "A", "items": []}]}
    assert team.put("/api/modeles/tarifs", json=bad_id).status_code == 422
    empty_name = {"groups": [{"id": "a", "name": "", "items": []}]}
    assert team.put("/api/modeles/tarifs", json=empty_name).status_code == 422
