"""Quote and invoice data, shared constants and server-side totals."""

import datetime as dt
from pathlib import Path
from typing import Annotated

from fastapi import Depends
from pydantic import BaseModel, ConfigDict, Field

from accounts.models import User
from accounts.sessions import team_member

FOLDER = Path(__file__).parent.parent / "modeles"
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
    "Tout incident de paiement est passible d'intérêt de retard. Le montant des pénalités résulte de l'application aux sommes "
    "restant dues d'un taux d'intérêt légal en vigueur au moment de l'incident. Indemnité forfaitaire pour frais de "
    "recouvrement due au créancier en cas de retard de paiement: 40€"
)
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
