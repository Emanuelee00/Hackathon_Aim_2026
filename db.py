"""SQLAlchemy engine and Alembic migrations, on the same database as store.py."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

from store import DATABASE_URL, SQLITE_PATH

ALEMBIC_INI = Path(__file__).parent / "alembic.ini"


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
    command.upgrade(config, "head")
