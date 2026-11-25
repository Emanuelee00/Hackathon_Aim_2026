"""« Factures et devis »: the team fills in a quote or an invoice on the site, then downloads it in Word (to adjust) or PDF.

The Word file is the association's own template (modeles/trame-*.docx) with its <<fields>> replaced, so the layout stays the same.
The PDF is drawn here as the same page. Totals are always computed on the server. The documents themselves are kept with their event
(the « Comptabilité » window, in the events of the store); here are kept the price list (the rates to click) and the last number used
for each kind and year, shared by the whole team. A quote or an invoice can also be e-mailed to the client with its PDF attached.
"""

import datetime as dt
import logging
import re
import zipfile
from email.message import EmailMessage
from io import BytesIO
from typing import Annotated
from urllib.parse import quote
from xml.sax.saxutils import escape
from zoneinfo import ZoneInfo

import mailer
from core import store
from equipe import messages
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from fpdf import FPDF
from pydantic import BaseModel, ConfigDict, Field
from sharing.confirmations import french_date

from .models import (
    FOLDER,
    FORMATS,
    IBAN,
    INVOICE_TERMS,
    ISSUER,
    TITLES,
    VAT_NOTE,
    Document,
    Team,
    Text,
    cents,
    long_date,
    money,
    number,
    totals,
)

router = APIRouter(prefix="/api/modeles")


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
        r"&lt;&lt;</w:t>.*?<w:t[^>]*>Nom&gt;&gt;",
        value(document.name),
        xml,
        flags=re.DOTALL,
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


# ---------- PDF: the same page as the Word templates (positions, fonts and colours measured on them) ----------

VIOLET = (104, 42, 127)  # 682a7f
GREY = (217, 217, 217)  # d9d9d9, head of the table
BORDER = (192, 192, 192)  # c0c0c0
INK = (31, 31, 31)  # 1f1f1f, the client
NOTE = (128, 128, 128)  # 808080, the invoice terms
FOOTER = (
    (
        "Chez Marthe / Association Loi 1901 enregistrée sous le N° W133041303 à la préfecture des Bouches-du-Rhône- "
        "N° Siret 100 396 464 00016"
    ),
    "Catégorie juridique : 9220 Association déclarée  -  contact.chezmarthe@gmail.com",
)
# Word's table columns (twips → mm): the invoice has a narrower « Quantité ».
COLUMNS = {"devis": (77.5, 31.2, 31.5, 31.2), "facture": (77.5, 26.7, 36.0, 31.2)}
LEFT, RIGHT = 20, 190
PAD = 1.9  # inner margin of a table cell


class Page(FPDF):
    def footer(self) -> None:
        self.set_font("Roboto", "", 7)
        self.set_text_color(51, 51, 51)
        for top, text in zip((278.0, 281.1), FOOTER, strict=True):
            self.set_xy(LEFT, top)
            self.cell(RIGHT - LEFT, 3.2, text, align="C")


def make_pdf(kind: str, document: Document) -> bytes:
    amounts = totals(document)
    pdf = Page(format="A4")
    pdf.set_margins(LEFT, 15, 210 - RIGHT)
    pdf.set_auto_page_break(True, 19)
    fonts = FOLDER / "fonts"
    pdf.add_font("Roboto", "", str(fonts / "Roboto-Regular.ttf"))
    pdf.add_font("Roboto", "B", str(fonts / "Roboto-Bold.ttf"))
    pdf.add_font("Roboto", "I", str(fonts / "Roboto-Italic.ttf"))
    pdf.add_font("Arial", "", str(fonts / "LiberationSans-Regular.ttf"))
    pdf.add_font("Arial", "B", str(fonts / "LiberationSans-Bold.ttf"))
    pdf.set_line_width(0.18)
    pdf.add_page()

    def write(
        x: float, baseline: float, text: str, style: str = "", size: float = 12
    ) -> float:
        pdf.set_font("Roboto", style, size)
        pdf.text(x, baseline, text)
        return x + pdf.get_string_width(text)

    def right(
        edge: float, baseline: float, text: str, style: str = "", size: float = 12
    ) -> None:
        pdf.set_font("Roboto", style, size)
        pdf.text(edge - pdf.get_string_width(text), baseline, text)

    # Head: logo, title and date, the association, the client.
    pdf.image(str(FOLDER / "logo.jpg"), x=LEFT, y=20.3, w=38.9)
    title_x = 117.1 if kind == "devis" else 99.5
    pdf.set_text_color(*VIOLET)
    write(title_x, 40.4, f"{TITLES[kind]} n° {document.number}", "B", 20)
    after = write(title_x, 45.4, "Date :", "B")
    write(after, 45.4, f" {long_date(document.date)}")
    top = 55.4 if kind == "devis" else 60.6
    for index, text in enumerate(ISSUER[:4]):
        write(LEFT, top + index * 5.1, text, "B")
    after = write(LEFT, top + 4 * 5.1, "SIRET : ", "B")
    write(after, top + 4 * 5.1, ISSUER[4].removeprefix("SIRET : "), "B", 9.5)
    pdf.set_text_color(*INK)
    client = [
        document.name,
        document.address,
        f"{document.postal_code} {document.city}".strip(),
    ]
    for index, text in enumerate(part for part in client if part):
        write(119.2, 100.7 + index * 5.8, text)

    # The table of benefits.
    widths = COLUMNS[kind]
    pdf.set_draw_color(*BORDER)
    pdf.set_text_color(0, 0, 0)
    pdf.set_xy(LEFT, 124.1)
    pdf.set_fill_color(*GREY)
    for (label, size), width, align in zip(
        (("Désignation", 11), ("Quantité", 11), ("Prix unit HT", 10), ("Total", 10)),
        widths,
        "LCCC",
        strict=True,
    ):
        pdf.set_font("Roboto", "", size)
        pdf.cell(
            width,
            8,
            f" {label}" if align == "L" else label,
            border=1,
            fill=True,
            align=align,
        )
    pdf.ln(8)
    if document.nature:
        pdf.set_font("Arial", "", 11)
        pdf.set_x(LEFT)
        pdf.multi_cell(
            sum(widths),
            8,
            f" {document.nature}",
            border=1,
            new_x="LMARGIN",
            new_y="NEXT",
        )
    pdf.set_font("Arial", "", 11)
    for line, total in zip(document.lines, amounts["rows"], strict=True):
        texts = (number(line.quantity), money(cents(line.unit_price)), money(total))
        lines = pdf.multi_cell(
            widths[0] - 2 * PAD, 5.5, line.designation, dry_run=True, output="LINES"
        )
        height = max(10.0, len(lines) * 5.5 + 4)
        if pdf.will_page_break(height):
            pdf.add_page()
        start = pdf.get_y()
        pdf.rect(LEFT, start, widths[0], height)
        pdf.set_xy(LEFT + PAD, start + (height - len(lines) * 5.5) / 2)
        pdf.multi_cell(widths[0] - 2 * PAD, 5.5, line.designation)
        x = LEFT + widths[0]
        for text, width, align in zip(texts, widths[1:], "CCR", strict=True):
            pdf.set_xy(x, start)
            pdf.cell(
                width,
                height,
                f"{text} " if align == "R" else text,
                border=1,
                align=align,
            )
            x += width
        pdf.set_xy(LEFT, start + height)

    # Totals, VAT note.
    rows = [("Total Hors Taxe", money(amounts["total"]))]
    if kind == "facture":
        rows += [
            ("Acompte versé", money(amounts["deposit"])),
            ("Total HT à payer", money(amounts["due"])),
        ]
    rows.append(
        (
            "Total TTC en euros",
            money(amounts["due"] if kind == "facture" else amounts["total"]),
        )
    )
    # What follows the table must stay on one page, above the footer (it starts at 278 mm).
    below_vat = 53 if kind == "devis" else 58
    if pdf.get_y() + 5.5 + len(rows) * 10 + 9 + below_vat > 277:
        pdf.add_page()
    label_x = 111.8 if kind == "devis" else 90.0
    y = pdf.get_y() + 5.5
    for label, text in rows:
        write(label_x, y + 6.6, label, "B")
        right(188.4, y + 6.6, text, "B")
        y += 10
    vat = y + 9
    right(188.6, vat, VAT_NOTE, "I")

    # Payment, and the acceptance box (quote) or the payment terms (invoice).
    pdf.set_text_color(*VIOLET)
    pay = vat + 20.2
    write(
        LEFT,
        pay,
        "Modalité de paiement : par virement bancaire"
        if kind == "devis"
        else "Paiement par virement",
        "B",
    )
    for index, text in enumerate(IBAN, start=1):
        write(LEFT, pay + index * 5.1, text)
    if kind == "devis":
        pdf.set_draw_color(0, 0, 0)
        pdf.set_line_width(0.2)
        pdf.rect(112.6, vat + 17, 76.1, 36)
        pdf.set_text_color(0, 0, 0)
        pdf.set_font("Arial", "B", 10.5)
        pdf.set_xy(112.6, vat + 18.5)
        pdf.cell(76.1, 5, "Acceptation de devis (date et signature)", align="C")
    else:
        pdf.set_text_color(*NOTE)
        pdf.set_font("Roboto", "I", 10)
        pdf.set_xy(LEFT, pay + 2 * 5.1 + 13.4 - 3.2)
        pdf.c_margin = 0
        pdf.multi_cell(RIGHT - LEFT, 4.2, INVOICE_TERMS, align="J")
    return bytes(pdf.output())


@router.post("/{kind}.{extension}")
def download(kind: str, extension: str, document: Document, user: Team) -> Response:
    """The quote or invoice filled in on the page, as a Word or PDF file to download."""
    if kind not in TITLES or extension not in FORMATS:
        raise HTTPException(404, "Modèle introuvable.")
    content = (fill_docx if extension == "docx" else make_pdf)(kind, document)
    record_number(kind, document.number)
    name = f"{TITLES[kind].capitalize()} {document.number}".replace("/", "-")
    return Response(
        content,
        media_type=FORMATS[extension],
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(name)}.{extension}"
        },
    )


# ---------- Numbers shared by the team: « 2026-014 » is the 14th quote (or invoice) of 2026 ----------

NUMBERS_KEY = "document_numbers"
PARIS = ZoneInfo("Europe/Paris")
NUMBER = re.compile(r"^(\d{4})-(\d{1,6})$")


def last_numbers() -> dict:
    return store.load_document(NUMBERS_KEY) or {}


def this_year() -> int:
    return dt.datetime.now(PARIS).year


def next_number(kind: str, year: int) -> str:
    return f"{year}-{last_numbers().get(f'{kind}-{year}', 0) + 1:03d}"


def record_number(kind: str, number: str) -> None:
    """Remembers a number that was used, so the next one suggested comes after it."""
    match = NUMBER.match(number.strip())
    if not match:
        return
    numbers = last_numbers()
    key = f"{kind}-{match[1]}"
    numbers[key] = max(numbers.get(key, 0), int(match[2]))
    store.save_document(NUMBERS_KEY, numbers)


def check_kind(kind: str) -> None:
    if kind not in TITLES:
        raise HTTPException(404, "Modèle introuvable.")


class Used(BaseModel):
    number: Text = ""


@router.get("/numeros/{kind}")
def suggest_number(kind: str, user: Team) -> dict:
    """The next number of this year, without taking it."""
    check_kind(kind)
    return {"number": next_number(kind, this_year())}


@router.post("/numeros/{kind}")
def take_number(kind: str, used: Used, user: Team) -> dict:
    """With a number: records it as used. Without: takes the next one of this year (a new document of an event)."""
    check_kind(kind)
    number = used.number or next_number(kind, this_year())
    record_number(kind, number)
    return {"number": number, "next": next_number(kind, this_year())}


# ---------- Sending a quote or an invoice to the client, with its PDF ----------

log = logging.getLogger("marthe.modeles")
TEMPLATE_OF = {"devis": "quote", "facture": "invoice"}
Email = Annotated[str, Field(max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]


class Sending(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    to: Email
    document: Document
    event: Text = ""  # the event's name and date, for the e-mail's text
    event_date: dt.date | None = None


def document_mail(kind: str, sending: Sending) -> EmailMessage:
    document = sending.document
    amounts = totals(document)
    values = {
        "nom": document.name,
        "numero": document.number,
        "montant": money(amounts["due"] if kind == "facture" else amounts["total"]),
        "evenement": sending.event or document.nature or TITLES[kind].lower(),
        "date_evenement": french_date(
            (sending.event_date or document.date).isoformat()
        ),
        "contact": messages.contact_address(),
    }
    subject, body = messages.current(TEMPLATE_OF[kind])
    mail = EmailMessage()
    mail["Subject"] = messages.render(subject, values)
    mail["From"] = messages.funding_from()
    mail["To"] = sending.to
    mail["Reply-To"] = messages.contact_address()
    mail.set_content(messages.render(body, values))
    name = f"{TITLES[kind].capitalize()} {document.number}".replace("/", "-")
    mail.add_attachment(
        make_pdf(kind, document),
        maintype="application",
        subtype="pdf",
        filename=f"{name}.pdf",
    )
    return mail


@router.post("/{kind}/envoyer")
def send(kind: str, sending: Sending, user: Team) -> dict:
    """E-mails the quote or the invoice to the client, as a PDF, with the team's text from the « Messages » page."""
    check_kind(kind)
    if not mailer.configured():
        raise HTTPException(
            503,
            "L’envoi des e-mails n’est pas encore branché : téléchargez le PDF et envoyez-le vous-même.",
        )
    try:
        mailer.deliver(document_mail(kind, sending))
    except Exception as problem:
        log.warning("%s %s not sent: %s", kind, sending.document.number, problem)
        raise HTTPException(
            502, "L’e-mail n’est pas parti. Réessayez dans un instant."
        ) from problem
    record_number(kind, sending.document.number)
    return {"sent": True, "to": sending.to, "at": dt.datetime.now(dt.UTC).isoformat()}


# ---------- Price list (the rates the team clicks to fill a quote or an invoice) ----------

PRICE_KEY = "price_list"
Slug = Annotated[str, Field(min_length=1, max_length=60, pattern=r"^[\w-]+$")]


class PriceItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    id: Slug
    name: Text = Field(min_length=1, max_length=80)
    price: float = Field(ge=0, le=1_000_000)


class PriceGroup(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    id: Slug
    name: Text = Field(min_length=1, max_length=80)
    items: list[PriceItem] = Field(max_length=30)


class PriceList(BaseModel):
    groups: list[PriceGroup] = Field(max_length=20)


@router.get("/tarifs")
def read_prices(user: Team) -> dict:
    """The team's saved rates; null until they have changed the original ones (the page then shows its own)."""
    return {"groups": store.load_document(PRICE_KEY)}


@router.put("/tarifs")
def save_prices(prices: PriceList, user: Team) -> dict:
    groups = prices.model_dump()["groups"]
    store.save_document(PRICE_KEY, groups)
    return {"groups": groups}


@router.delete("/tarifs")
def reset_prices(user: Team) -> dict:
    store.save_document(PRICE_KEY, None)
    return {"groups": None}
