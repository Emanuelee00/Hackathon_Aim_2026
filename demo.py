"""Public-link mode: pre-written answers replace the local model."""

import json
import os
from pathlib import Path

# MARTHE_DEMO=1 serves the pre-written answers instead of calling the local model.
DEMO_MODE = bool(os.getenv("MARTHE_DEMO"))
# Seconds of simulated analysis, so the progress bar plays as with the model.
DEMO_DELAY = 6
RESPONSES = json.loads(
    (Path(__file__).parent / "demo_responses.json").read_text(encoding="utf-8")
)


def demo_rationales(event_title: str, ranked: list[tuple[dict, list[str]]]) -> dict:
    texts = RESPONSES["matching"].get(event_title, {})
    return {
        profile["id"]: {"resident_id": profile["id"], **texts[profile["id"]]}
        for profile, _ in ranked
        if profile["id"] in texts
    }


def demo_plan(objective: str, acquired_skills: list[str]) -> dict | None:
    plan = RESPONSES["employment"].get(objective.strip().casefold())
    if not plan:
        return None
    return {**plan, "strengths": [*acquired_skills[:2], *plan["strengths"]][:5]}


def demo_cv_lines(objective: str, skills: list[str]) -> dict | None:
    entry = RESPONSES["cv_lines"].get(objective.strip().casefold())
    if not entry or not all(skill in entry["lines"] for skill in skills):
        return None
    lines = [{"skill": skill, "line": entry["lines"][skill]} for skill in skills]
    return {"lines": lines, "advice": entry["advice"]}
