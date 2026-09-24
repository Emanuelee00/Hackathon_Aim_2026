"""Storage of the shared documents; who may read or change them is in sharing/."""

import json
import os
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Literal

import psycopg

# Postgres when configured (docker compose, hosted database); SQLite otherwise.
DATABASE_URL = os.getenv("DATABASE_URL")
# Vercel only allows writing to /tmp: data there is lost when the instance stops.
SQLITE_PATH = (
    Path("/tmp" if os.getenv("VERCEL") else Path(__file__).parent) / "marthe.db"
)
CREATE = (
    "CREATE TABLE IF NOT EXISTS documents (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
)
Key = Literal["events", "matches", "partners", "visitSlots", "laughs"]


def execute(sql: str, params: tuple = ()) -> list[tuple]:
    if DATABASE_URL:
        with psycopg.connect(DATABASE_URL) as db:
            db.execute(CREATE)
            cursor = db.execute(sql.replace("?", "%s"), params)
            return cursor.fetchall() if cursor.description else []
    with closing(sqlite3.connect(SQLITE_PATH)) as db, db:
        db.execute(CREATE)
        return db.execute(sql, params).fetchall()


def load_document(key: str) -> list | None:
    rows = execute("SELECT value FROM documents WHERE key = ?", (key,))
    return json.loads(rows[0][0]) if rows else None


def save_document(key: str, value: list) -> None:
    execute(
        "INSERT INTO documents (key, value) VALUES (?, ?) "
        "ON CONFLICT (key) DO UPDATE SET value = excluded.value",
        (key, json.dumps(value, ensure_ascii=False)),
    )
