"""Several uvicorn workers migrate at the same time: on an empty SQLite file they must take turns."""

import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[2]
MIGRATE = (
    "import sys; from sqlalchemy import create_engine; from core import db;"
    " db.engine = create_engine('sqlite:///' + sys.argv[1]); db.migrate()"
)


def test_workers_migrating_together_do_not_collide(tmp_path):
    database = tmp_path / "workers.db"
    env = {**os.environ, "PYTHONPATH": str(BACKEND)}
    workers = [
        subprocess.Popen(
            [sys.executable, "-c", MIGRATE, str(database)],
            env=env,
            stderr=subprocess.PIPE,
            text=True,
        )
        for _ in range(4)
    ]
    errors = [worker.communicate()[1] for worker in workers if worker.wait() != 0]
    assert not errors, errors[0]
