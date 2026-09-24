"""Public-link mode: pre-written answers replace the local model."""

import json
import os
from pathlib import Path

# Vercel sets VERCEL; MARTHE_DEMO=1 simulates the public link locally.
DEMO_MODE = bool(os.getenv("VERCEL") or os.getenv("MARTHE_DEMO"))
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
