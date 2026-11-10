"""« Factures et devis »: the team fills in a quote or an invoice on the site, then downloads it in Word (to adjust) or PDF.

The Word file is the association's own template (modeles/trame-*.docx) with its <<fields>> replaced, so the layout stays the same.
The PDF is drawn here with the same content. Totals are always computed on the server. Nothing is stored.
"""

import datetime as dt
import re
import zipfile
from io import BytesIO
from pathlib import Path
from typing import Annotated
from urllib.parse import quote
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from fpdf import FPDF
from pydantic import BaseModel, ConfigDict, Field

from accounts.models import User
from accounts.sessions import team_member

FOLDER = Path(__file__).parent / "modeles"
FORMATS = {
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pdf": "application/pdf",
}
TITLES = {"devis": "DEVIS", "facture": "FACTURE"}
ISSUER = (
    "Association Chez Marthe",
    "50, rue Saint Savournin",
    "13001 Marseille",
    "contact.chezmarthe@gmail.com",
    "SIRET : 100 396 464 00016",
)
VAT_NOTE = "Tva non applicable, article 293 B du CGI"
IBAN = ("IBAN : FR76 1027 8089 7200 0220 7280 129", "BIC : CMCIFR2A")
INVOICE_TERMS = (
    "Conditions de paiement : paiement à réception de facture, à 30 jours. Aucun escompte consenti pour règlement anticipé. "
    "Tout incident de paiement est passible d’intérêt de retard. Le montant des pénalités résulte de l’application aux sommes "
    "restant dues d’un taux d’intérêt légal en vigueur au moment de l’incident. Indemnité forfaitaire pour frais de "
    "recouvrement due au créancier en cas de retard de paiement : 40 €"
)
router = APIRouter(prefix="/api/modeles")
Team = Annotated[User, Depends(team_member)]
Text = Annotated[str, Field(max_length=200, pattern=r"^[^\x00-\x08\x0b-\x1f]*$")]


class Line(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    designation: Text = Field(min_length=1)
    quantity: float = Field(gt=0, le=1_000_000)
    unit_price: float = Field(ge=0, le=100_000_000)


class Document(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    number: Text = Field(min_length=1, max_length=40)
    date: dt.date
    name: Text = Field(min_length=1)
    address: Text = ""
    postal_code: Text = Field(default="", max_length=20)
    city: Text = Field(default="", max_length=80)
    nature: Text = ""
    lines: list[Line] = Field(min_length=1, max_length=30)
    deposit: float = Field(default=0, ge=0, le=100_000_000)  # invoice only


def cents(value: float) -> int:
    return round(value * 100)


def money(amount_cents: int) -> str:
    euros, rest = divmod(abs(amount_cents), 100)
    sign = "-" if amount_cents < 0 else ""
    return f"{sign}{euros:,}".replace(",", " ") + f",{rest:02d} €"


def number(value: float) -> str:
    return f"{value:g}".replace(".", ",")


def totals(document: Document) -> dict:
    rows = [
        (cents(line.quantity * line.unit_price), cents(line.unit_price))
        for line in document.lines
    ]
    total = sum(row[0] for row in rows)
    deposit = cents(document.deposit)
    return {
        "rows": [row[0] for row in rows],
        "total": total,
        "deposit": deposit,
        "due": total - deposit,
    }


def long_date(value: dt.date) -> str:
    return value.strftime("%d/%m/%Y")


# ---------- Word: the association's template with its fields replaced ----------


def fill_docx(kind: str, document: Document) -> bytes:
    amounts = totals(document)
    source = zipfile.ZipFile(FOLDER / f"trame-{kind}.docx")
    xml = source.read("word/document.xml").decode("utf8")

    def value(text: str) -> str:
        return escape(text)

    # the line of the table that holds the first benefit is repeated once per line
    rows = re.findall(r"<w:tr>.*?</w:tr>", xml, flags=re.DOTALL)
    model = next(row for row in rows if "Prestation 1" in row)
    made = []
    for line, total in zip(document.lines, amounts["rows"], strict=True):
        row = model
        for token, text in (
            ("&lt;&lt;Prestation 1&gt;&gt;", line.designation),
            ("&lt;&lt;Qté 1&gt;&gt;", number(line.quantity)),
            ("&lt;&lt;Prix unit. 1&gt;&gt;", money(cents(line.unit_price))),
            ("&lt;&lt;Total 1&gt;&gt;", money(total)),
        ):
            row = row.replace(token, value(text))
        made.append(row)
    xml = xml.replace(model, "".join(made), 1)

    # « <<Nom>> » is split in two runs in the templates
    xml = re.sub(
        r"&lt;&lt;</w:t>.*?<w:t[^>]*>Nom&gt;&gt;", value(document.name), xml, flags=re.DOTALL
    )
    final = money(amounts["due"] if kind == "facture" else amounts["total"])
    replacements = {
        "&lt;&lt;N° DE&gt;&gt;": document.number,
        "&lt;&lt;N° FA&gt;&gt;": document.number,
        "&lt;&lt;Date&gt;&gt;": long_date(document.date),
        "&lt;&lt;Adresse&gt;&gt;": document.address,
        "&lt;&lt;Code postal&gt;&gt;": document.postal_code,
        "&lt;&lt;Ville&gt;&gt;": document.city,
        "&lt;&lt;Nature prestation&gt;&gt;": document.nature,
        "&lt;&lt;Acompte versé&gt;&gt;": money(amounts["deposit"]),
        "&lt;&lt;Total HT à payer&gt;&gt;": final,
        "&lt;&lt;Total HT&gt;&gt;": money(amounts["total"]),
    }
    for token, text in replacements.items():
        xml = xml.replace(token, value(text))
    output = BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as target:
        for item in source.infolist():
            data = (
                xml.encode("utf8")
                if item.filename == "word/document.xml"
                else source.read(item.filename)
            )
            target.writestr(item, data)
    return output.getvalue()


# ---------- PDF ----------

VIOLET = (104, 42, 127)
GREY = (217, 217, 217)


def make_pdf(kind: str, document: Document) -> bytes:
    amounts = totals(document)
    pdf = FPDF(format="A4")
    pdf.set_margins(20, 12, 20)
    pdf.set_auto_page_break(True, 18)
    pdf.add_font("Sans", "", str(FOLDER / "fonts" / "DejaVuSans.ttf"))
    pdf.add_font("Sans", "B", str(FOLDER / "fonts" / "DejaVuSans-Bold.ttf"))
    pdf.add_page()
    pdf.image(str(FOLDER / "logo.jpg"), x=20, y=12, w=38)
    pdf.set_xy(20, 18)
    pdf.set_font("Sans", "B", 20)
    pdf.set_text_color(*VIOLET)
    pdf.cell(
        0,
        10,
        f"{TITLES[kind]} n° {document.number}",
        align="R",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.set_font("Sans", "", 10)
    pdf.set_text_color(31, 31, 31)
    pdf.cell(
        0,
        6,
        f"Date : {long_date(document.date)}",
        align="R",
        new_x="LMARGIN",
        new_y="NEXT",
    )

    top = 62
    pdf.set_xy(20, top)
    pdf.set_font("Sans", "B", 10)
    pdf.cell(85, 6, ISSUER[0], new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Sans", "", 10)
    for text in ISSUER[1:]:
        pdf.cell(85, 6, text, new_x="LMARGIN", new_y="NEXT")
    pdf.set_xy(115, top)
    pdf.multi_cell(
        75,
        6,
        "\n".join(
            part
            for part in (
                document.name,
                document.address,
                f"{document.postal_code} {document.city}".strip(),
            )
            if part
        ),
    )

    pdf.set_xy(20, 104)
    widths = (84, 24, 32, 30)
    pdf.set_fill_color(*VIOLET)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Sans", "B", 10)
    for label, width, align in zip(
        ("Désignation", "Quantité", "Prix unit HT", "Total"),
        widths,
        "LRRR",
        strict=True,
    ):
        pdf.cell(width, 8, label, fill=True, align=align)
    pdf.ln(8)
    pdf.set_text_color(31, 31, 31)
    pdf.set_font("Sans", "", 10)
    if document.nature:
        pdf.set_font("Sans", "B", 10)
        pdf.cell(
            sum(widths), 8, document.nature, border="B", new_x="LMARGIN", new_y="NEXT"
        )
        pdf.set_font("Sans", "", 10)
    for line, total in zip(document.lines, amounts["rows"], strict=True):
        start = pdf.get_y()
        pdf.multi_cell(
            widths[0], 7, line.designation, border="B", new_x="RIGHT", new_y="TOP"
        )
        height = max(7, pdf.get_y() - start)
        pdf.set_xy(20 + widths[0], start)
        for text, width in zip(
            (number(line.quantity), money(cents(line.unit_price)), money(total)),
            widths[1:],
            strict=True,
        ):
            pdf.cell(width, height, text, border="B", align="R")
        pdf.set_xy(20, start + height)

    pdf.ln(6)
    rows = [("Total Hors Taxe", money(amounts["total"]), False)]
    if kind == "facture":
        rows += [
            ("Acompte versé", money(amounts["deposit"]), False),
            ("Total HT à payer", money(amounts["due"]), False),
        ]
    rows.append(
        (
            "Total TTC en euros",
            money(amounts["due"] if kind == "facture" else amounts["total"]),
            True,
        )
    )
    for label, text, bold in rows:
        pdf.set_x(100)
        pdf.set_font("Sans", "B" if bold else "", 10)
        pdf.set_fill_color(*GREY)
        pdf.cell(45, 8, label, fill=True)
        pdf.cell(45, 8, text, align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Sans", "", 8.5)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 8, VAT_NOTE, align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(31, 31, 31)

    pdf.ln(6)
    if kind == "devis":
        pdf.set_font("Sans", "", 9)
        pdf.rect(20, pdf.get_y(), 85, 32)
        pdf.set_xy(23, pdf.get_y() + 3)
        pdf.cell(80, 5, "Acceptation de devis (date et signature)")
        pdf.set_xy(20, pdf.get_y() + 36)
        pdf.set_font("Sans", "B", 10)
        pdf.cell(
            0,
            6,
            "Modalité de paiement : par virement bancaire",
            new_x="LMARGIN",
            new_y="NEXT",
        )
    else:
        pdf.set_font("Sans", "B", 10)
        pdf.cell(0, 6, "Paiement par virement", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Sans", "", 10)
    for text in IBAN:
        pdf.cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")
    if kind == "facture":
        pdf.ln(4)
        pdf.set_font("Sans", "", 8)
        pdf.multi_cell(0, 4.5, INVOICE_TERMS)
    return bytes(pdf.output())


@router.post("/{kind}.{extension}")
def download(kind: str, extension: str, document: Document, user: Team) -> Response:
    """The quote or invoice filled in on the page, as a Word or PDF file to download."""
    if kind not in TITLES or extension not in FORMATS:
        raise HTTPException(404, "Modèle introuvable.")
    content = (fill_docx if extension == "docx" else make_pdf)(kind, document)
    name = f"{TITLES[kind].capitalize()} {document.number}".replace("/", "-")
    return Response(
        content,
        media_type=FORMATS[extension],
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(name)}.{extension}"
        },
    )
