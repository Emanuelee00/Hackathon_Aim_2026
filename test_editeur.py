import io
import zipfile
from xml.dom import minidom

import editeur
from test_store import client_as  # noqa: F401  (pytest fixture)

PAGE = {
    "title": "Lettre à l’attention de la mairie",
    "letterhead": True,
    "blocks": [
        {"kind": "h1", "align": "center", "runs": [{"text": "Attestation"}]},
        {
            "kind": "p",
            "runs": [
                {"text": "Bonjour "},
                {"text": "Awa", "bold": True},
                {"text": " & <b>test</b>", "italic": True, "underline": True},
            ],
        },
        {"kind": "ul", "runs": [{"text": "premier point"}]},
        {"kind": "ul", "runs": [{"text": "second\npoint €"}]},
        {"kind": "ol", "runs": [{"text": "un"}]},
        {"kind": "ol", "runs": [{"text": "deux"}]},
    ],
}


def teams(client_as):  # noqa: F811
    clients = client_as("equipe"), client_as("residents"), client_as(None)
    for client in clients:
        client.app.include_router(editeur.router)
    return clients


def test_word_file_is_valid_and_keeps_the_text_and_formatting(client_as):  # noqa: F811
    team, _, _ = teams(client_as)
    answer = team.post("/api/editeur/docx", json=PAGE)
    assert answer.status_code == 200
    xml = zipfile.ZipFile(io.BytesIO(answer.content)).read("word/document.xml").decode()
    minidom.parseString(xml)  # well-formed
    for text in (
        "Attestation",
        "Association Chez Marthe",
        "&amp; &lt;b&gt;test&lt;/b&gt;",
        "• ",
        "2. ",
    ):
        assert text in xml
    assert (
        "<w:b/>" in xml
        and "<w:i/>" in xml
        and 'w:val="center"' in xml
        and "<w:br/>" in xml
    )


def test_pdf_and_letterhead_option(client_as):  # noqa: F811
    team, _, _ = teams(client_as)
    answer = team.post("/api/editeur/pdf", json=PAGE)
    assert answer.status_code == 200 and answer.content.startswith(b"%PDF")
    plain = team.post("/api/editeur/docx", json={**PAGE, "letterhead": False}).content
    assert b"SIRET" not in zipfile.ZipFile(io.BytesIO(plain)).read("word/document.xml")
    assert (
        team.post("/api/editeur/pdf", json={"blocks": []}).status_code == 200
    )  # an empty page is fine


def test_only_the_team_and_known_formats(client_as):  # noqa: F811
    team, resident, anonymous = teams(client_as)
    assert resident.post("/api/editeur/pdf", json=PAGE).status_code == 403
    assert anonymous.post("/api/editeur/pdf", json=PAGE).status_code == 401
    assert team.post("/api/editeur/exe", json=PAGE).status_code == 404
    assert (
        team.post("/api/editeur/pdf", json={"blocks": [{"kind": "script"}]}).status_code
        == 422
    )


def cell(text, **kw):
    return {"runs": [{"text": text}], **kw}


TABLE_PAGE = {
    "title": "Devis 12",
    "logo": True,
    "blocks": [
        {"kind": "h1", "align": "right", "runs": [{"text": "DEVIS n° 12"}]},
        {
            "kind": "table",
            "widths": [50, 15, 20, 15],
            "rows": [
                [
                    cell(t, shade="violet")
                    for t in ("Désignation", "Quantité", "Prix", "Total")
                ],
                [
                    cell("Chapelle & co"),
                    cell("2", align="center"),
                    cell("150,00 €", align="right"),
                    cell("300,00 €", align="right"),
                ],
            ],
        },
        {"kind": "p", "runs": [{"text": "Après le tableau"}]},
        {
            "kind": "table",
            "borders": "none",
            "rows": [[cell("Total", shade="grey"), cell("300,00 €", align="right")]],
        },
    ],
}


def test_tables_and_logo_in_word_and_pdf(client_as):  # noqa: F811
    team, _, _ = teams(client_as)
    answer = team.post("/api/editeur/docx", json=TABLE_PAGE)
    assert answer.status_code == 200
    archive = zipfile.ZipFile(io.BytesIO(answer.content))
    xml = archive.read("word/document.xml").decode()
    minidom.parseString(xml)
    minidom.parseString(archive.read("word/_rels/document.xml.rels"))
    assert "word/media/logo.jpg" in archive.namelist()
    assert (
        xml.count("<w:tbl>") == 2
        and "Chapelle &amp; co" in xml
        and 'w:fill="682A7F"' in xml
    )
    pdf = team.post("/api/editeur/pdf", json=TABLE_PAGE)
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")
    too_wide = {"kind": "table", "rows": [[cell("x")] * 9]}
    assert team.post("/api/editeur/pdf", json={"blocks": [too_wide]}).status_code == 422
