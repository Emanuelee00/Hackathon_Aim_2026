import json
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import ValidationError

from .cv_lines import generate_lines
from .extraction import MAX_FILE_SIZE, extract_cv_text
from .models import CvLines, CvLinesRequest, EmploymentContext, EmploymentPlan
from .planning import generate_plan

router = APIRouter(prefix="/api")


@router.post("/employment-plan", response_model=EmploymentPlan)
async def employment_plan(
    cv: Annotated[UploadFile, File()],
    objective: Annotated[str, Form()],
    resident_name: Annotated[str, Form()],
    acquired_skills: Annotated[str, Form()] = "[]",
) -> EmploymentPlan:
    try:
        skills = json.loads(acquired_skills)
        context = EmploymentContext(
            resident_name=resident_name, objective=objective, acquired_skills=skills
        )
    except (json.JSONDecodeError, ValidationError, TypeError) as exc:
        raise HTTPException(
            422, "Les informations du parcours sont invalides."
        ) from exc
    text = extract_cv_text(cv.filename or "", await cv.read(MAX_FILE_SIZE + 1))
    return generate_plan(context, text)


@router.post("/cv-lines", response_model=CvLines)
def cv_lines(request: CvLinesRequest) -> CvLines:
    return generate_lines(request)
