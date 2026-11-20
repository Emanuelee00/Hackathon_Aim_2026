from io import BytesIO
from pathlib import Path

from docx import Document
from fastapi import HTTPException
from pypdf import PdfReader

MAX_FILE_SIZE = 4 * 1024 * 1024
MAX_TEXT_LENGTH = 12_000


def _pdf_text(content: bytes) -> str:
    try:
        return "\n".join(
            page.extract_text() or "" for page in PdfReader(BytesIO(content)).pages
        )
    except Exception as exc:
        raise HTTPException(422, "Ce PDF ne peut pas être lu.") from exc


def _docx_text(content: bytes) -> str:
    try:
        document = Document(BytesIO(content))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)
    except Exception as exc:
        raise HTTPException(422, "Ce document Word ne peut pas être lu.") from exc


def extract_cv_text(filename: str, content: bytes) -> str:
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(413, "Le CV dépasse la taille maximale de 4 Mo.")
    suffix = Path(filename).suffix.lower()
    if suffix not in {".pdf", ".docx"}:
        raise HTTPException(422, "Formats acceptés : PDF et DOCX.")
    raw_text = _pdf_text(content) if suffix == ".pdf" else _docx_text(content)
    text = "\n".join(line.strip() for line in raw_text.splitlines() if line.strip())
    if len(text) < 40:
        raise HTTPException(422, "Le CV ne contient pas assez de texte lisible.")
    return text[:MAX_TEXT_LENGTH]
