"""The app must start the way uvicorn starts it (`--app-dir backend`), without pytest's pythonpath."""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_main_imports_like_uvicorn_app_dir():
    env = {k: v for k, v in os.environ.items() if k != "PYTHONPATH"}
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "import sys; sys.path.insert(0, 'backend'); import main; main.app",
        ],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
