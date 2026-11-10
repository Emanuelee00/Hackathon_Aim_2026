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
