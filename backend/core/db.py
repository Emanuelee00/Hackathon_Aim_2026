"""SQLAlchemy engine and Alembic migrations, on the same database as store.py."""

import fcntl
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session

from . import store
from .store import DATABASE_URL, SQLITE_PATH

ALEMBIC_INI = Path(__file__).parent.parent / "alembic.ini"
MIGRATION_LOCK = 4242


class Base(DeclarativeBase):
    pass


def database_url() -> str:
    if not DATABASE_URL:
        return f"sqlite:///{SQLITE_PATH}"
    # SQLAlchemy needs the driver name to use psycopg 3 instead of psycopg2.
    return DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)


engine = create_engine(database_url())


def get_session():
    with Session(engine) as session:
        yield session


def migrate() -> None:
    """Brings the database schema up to date (safe to run on every start)."""
    config = Config(ALEMBIC_INI)
    # Keeps uvicorn's logging untouched when called from the app.
    config.attributes["configure_logger"] = False
    # Each uvicorn worker migrates at startup: a lock makes them take turns
    # instead of creating the same tables at once on an empty database.
    if engine.dialect.name != "postgresql":
        database = engine.url.database
        if not database or database == ":memory:":
            command.upgrade(config, "head")
            return
        # SQLite has no advisory lock: an exclusive lock on a file next to the database.
        with open(f"{database}.migrate.lock", "w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            command.upgrade(config, "head")
        return
    with engine.connect() as lock:
        lock.execute(text("SELECT pg_advisory_lock(:id)"), {"id": MIGRATION_LOCK})
        try:
            command.upgrade(config, "head")
            store.execute("SELECT 1")  # creates the documents table
        finally:
            lock.execute(text("SELECT pg_advisory_unlock(:id)"), {"id": MIGRATION_LOCK})
