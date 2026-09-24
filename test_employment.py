import asyncio
import json
from io import BytesIO
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import httpx
from docx import Document

from employment.cv_lines import generate_lines
from employment.extraction import extract_cv_text
from employment.models import CvEvent, CvLinesRequest, EmploymentContext
from employment.planning import generate_plan
from employment.proposals import cv_proposals
from employment.routes import employment_plan


def context() -> EmploymentContext:
    return EmploymentContext(
        resident_name="Marie",
        objective="Commis de cuisine",
        acquired_skills=["Cuisine collective"],
    )


def test_extracts_text_from_docx():
    document = Document()
    document.add_paragraph("Marie D. — Expérience en cuisine collective")
    document.add_paragraph("Préparation de repas et organisation d'équipe")
    output = BytesIO()
    document.save(output)
    text = extract_cv_text("cv.docx", output.getvalue())
    assert "cuisine collective" in text
    assert "Préparation de repas" in text


def test_employment_plan_uses_valid_ai_response(monkeypatch):
    result = {
        "summary": "Profil cohérent avec la restauration.",
        "strengths": ["Cuisine collective"],
        "gaps": ["Préciser les volumes préparés"],
        "cv_suggestions": ["Ajouter l'expérience Chez Marthe"],
        "steps": [
            {
                "title": "CV",
                "action": "Adapter le titre.",
                "timeframe": "Cette semaine",
            },
            {
                "title": "Offres",
                "action": "Choisir trois offres.",
                "timeframe": "Sous 10 jours",
            },
            {
                "title": "Candidature",
                "action": "Envoyer un CV adapté.",
                "timeframe": "Sous 2 semaines",
            },
        ],
    }
    transport = httpx.MockTransport(
        lambda request: httpx.Response(
            200, json={"message": {"content": json.dumps(result)}}
        )
    )
    monkeypatch.setattr(
        "employment.planning.httpx.Client",
        MagicMock(return_value=httpx.Client(transport=transport)),
    )
    plan = generate_plan(
        context(), "Expérience longue en cuisine collective et préparation de repas."
    )
    assert plan.source == "ai"
    assert plan.steps[0].title == "CV"


def test_employment_plan_falls_back_when_model_is_unavailable(monkeypatch):
    monkeypatch.setattr(
        "employment.planning.httpx.Client",
        MagicMock(side_effect=httpx.ConnectError("offline")),
    )
    plan = generate_plan(
        context(),
        "Expérience en accueil, organisation et préparation de repas collectifs.",
    )
    assert plan.source == "guided"
    assert len(plan.steps) == 3
    assert plan.strengths == ["Cuisine collective"]


def test_employment_endpoint_accepts_a_real_docx(monkeypatch):
    document = Document()
    document.add_paragraph(
        "Expérience en restauration collective et préparation de repas"
    )
    document.add_paragraph("Accueil des participantes et organisation du matériel")
    output = BytesIO()
    document.save(output)
    monkeypatch.setattr(
        "employment.planning.httpx.Client",
        MagicMock(side_effect=httpx.ConnectError("offline")),
    )
    upload = MagicMock(filename="cv.docx")
    upload.read = AsyncMock(return_value=output.getvalue())
    plan = asyncio.run(
        employment_plan(
            cv=upload,
            objective="Commis de cuisine",
            resident_name="Marie",
            acquired_skills='["Cuisine collective"]',
        )
    )
    assert plan.source == "guided"


def test_technical_cv_cooking_goal_does_not_invent_cooking_experience(monkeypatch):
    client = MagicMock(side_effect=AssertionError("Model must not invent a match"))
    monkeypatch.setattr("employment.planning.httpx.Client", client)
    plan = generate_plan(
        EmploymentContext(
            resident_name="Alex", objective="Commis de cuisine", acquired_skills=[]
        ),
        "Développeur web. Python, React, SQL. Documentation et tests logiciels.",
    )
    assert plan.source == "guided"
    assert "Python" in plan.summary
    assert "ne prouvent ni expérience" in plan.summary
    assert "reconversion" in plan.cv_suggestions[0]
    assert "Découvrir le travail en cuisine" == plan.steps[1].title
    client.assert_not_called()


def test_mixed_cv_does_not_deny_existing_cooking_experience():
    plan = generate_plan(
        EmploymentContext(
            resident_name="Alex", objective="Cuisinier", acquired_skills=[]
        ),
        "Développeur Python. Ancien commis de cuisine pendant deux ans.",
    )
    assert "Si vous avez aussi une expérience en cuisine" in plan.summary
    assert "aucune expérience" not in plan.summary


def test_demo_cv_files_are_readable():
    for name in ("cv-marie-demo.docx", "cv-tech-demo.docx"):
        file = Path(__file__).parent / "web" / "public" / "demo" / name
        text = extract_cv_text(name, file.read_bytes())
        assert "fictif" in text
        assert len(text) > 100


def test_demo_mode_serves_prewritten_plan_without_model(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr("employment.planning.httpx.Client", client)
    monkeypatch.setattr("employment.planning.DEMO_MODE", True)
    monkeypatch.setattr("employment.planning.DEMO_DELAY", 0)
    demo = generate_plan(context(), "Préparation de repas familiaux")
    unknown = context().model_copy(update={"objective": "Pilote de ligne"})
    assert demo.source == "ai" and len(demo.steps) == 4
    assert demo.strengths[0] == context().acquired_skills[0]
    assert generate_plan(unknown, "Préparation de repas").source == "guided"
    client.assert_not_called()


def cv_request(objective="Vente"):
    skill = {
        "skill": "Accueil des participantes et organisation de la table",
        "event": "Le brunch des voisines",
        "date": "19 septembre 2026",
    }
    return CvLinesRequest(objective=objective, skills=[skill])


def test_cv_lines_keep_journey_skills_and_model_wording(monkeypatch):
    content = {
        "lines": [{"skill": "Inventée", "line": "Accueilli les participantes."}],
        "advice": "Placez-la dans « Expériences bénévoles ».",
    }
    transport = httpx.MockTransport(
        lambda request: httpx.Response(
            200, json={"message": {"content": json.dumps(content)}}
        )
    )
    monkeypatch.setattr(
        "employment.cv_lines.httpx.Client",
        MagicMock(return_value=httpx.Client(transport=transport)),
    )
    result = generate_lines(cv_request())
    assert result.source == "ai"
    assert result.lines[0].skill == cv_request().skills[0].skill
    assert result.lines[0].line == "Accueilli les participantes."


def test_cv_lines_fall_back_when_model_fails_or_miscounts(monkeypatch):
    real_client = httpx.Client
    for response in (
        httpx.Response(500),
        httpx.Response(
            200,
            json={"message": {"content": json.dumps({"lines": [], "advice": "x"})}},
        ),
    ):
        transport = httpx.MockTransport(lambda request, response=response: response)
        monkeypatch.setattr(
            "employment.cv_lines.httpx.Client",
            MagicMock(return_value=real_client(transport=transport)),
        )
        result = generate_lines(cv_request())
        assert result.source == "guided"
        assert "Vente" in result.advice


def test_cv_lines_demo_mode_uses_prewritten_answers(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr("employment.cv_lines.httpx.Client", client)
    monkeypatch.setattr("employment.cv_lines.DEMO_MODE", True)
    monkeypatch.setattr("employment.cv_lines.DEMO_DELAY", 0)
    assert generate_lines(cv_request()).source == "ai"
    assert generate_lines(cv_request("Pilote de ligne")).source == "guided"
    client.assert_not_called()


def test_cv_proposals_link_only_events_the_cv_talks_about():
    events = [
        CvEvent(
            id="cuisine",
            title="Les saveurs",
            category="Cuisine",
            description="Préparation d'un déjeuner",
        ),
        CvEvent(
            id="yoga",
            title="Une pause",
            category="Bien-être",
            description="Yoga doux en équipe",
        ),
    ]
    proposals = cv_proposals(
        events, "Préparation de repas familiaux en équipe. Commis de cuisine"
    )
    assert [item.event_id for item in proposals] == ["cuisine"]
    assert "cuisine" in proposals[0].rationale
    assert cv_proposals(events, "Développeur React et SQL") == []
