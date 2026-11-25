"""Infrastructure shared by every feature: database and document store (db, store), the model client (ai), e-mail (mailer), demo mode, text ranking and the migrations."""

from .db import Base, engine, get_session, migrate
from .store import DATABASE_URL, SQLITE_PATH, load_document, save_document

__all__ = [
    "DATABASE_URL",
    "SQLITE_PATH",
    "Base",
    "engine",
    "get_session",
    "load_document",
    "migrate",
    "save_document",
]
