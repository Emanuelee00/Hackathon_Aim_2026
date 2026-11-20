"""Quotes and invoices: server-side totals, Word/PDF rendering, numbering, e-mail."""

from .routes import (
    FOLDER,
    FORMATS,
    GREY,
    ISSUER,
    VIOLET,
    Document,
    Sending,
    document_mail,
    make_pdf,
    money,
    router,
    this_year,
    totals,
)

__all__ = [
    "FOLDER",
    "FORMATS",
    "GREY",
    "ISSUER",
    "VIOLET",
    "Document",
    "Sending",
    "document_mail",
    "make_pdf",
    "money",
    "router",
    "this_year",
    "totals",
]
