"""Shared demo data, so every subdomain (équipe, résidentes…) sees the same state."""

import json
import os
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Annotated, Any, Literal

import psycopg
from fastapi import APIRouter, Body, HTTPException

router = APIRouter(prefix="/api")
# Postgres when configured (docker compose, hosted database); SQLite otherwise.
DATABASE_URL = os.getenv("DATABASE_URL")
# Vercel only allows writing to /tmp: data there is lost when the instance stops.
SQLITE_PATH = (
    Path("/tmp" if os.getenv("VERCEL") else Path(__file__).parent) / "marthe.db"
)
CREATE = (
    "CREATE TABLE IF NOT EXISTS documents (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
)
Key = Literal["events", "matches", "partners"]


def execute(sql: str, params: tuple = ()) -> list[tuple]:
    if DATABASE_URL:
        with psycopg.connect(DATABASE_URL) as db:
            db.execute(CREATE)
            cursor = db.execute(sql.replace("?", "%s"), params)
            return cursor.fetchall() if cursor.description else []
    with closing(sqlite3.connect(SQLITE_PATH)) as db, db:
        db.execute(CREATE)
        return db.execute(sql, params).fetchall()


@router.get("/store/{key}")
def read_document(key: Key) -> dict[str, Any]:
    rows = execute("SELECT value FROM documents WHERE key = ?", (key,))
    if not rows:
        raise HTTPException(404, "Aucune donnée enregistrée.")
    return {"value": json.loads(rows[0][0])}


@router.put("/store/{key}")
def write_document(key: Key, value: Annotated[list[Any], Body()]) -> dict[str, str]:
    execute(
        "INSERT INTO documents (key, value) VALUES (?, ?) "
        "ON CONFLICT (key) DO UPDATE SET value = excluded.value",
        (key, json.dumps(value, ensure_ascii=False)),
    )
    return {"status": "ok"}
