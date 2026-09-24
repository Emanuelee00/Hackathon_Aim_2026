from typing import Literal

from pydantic import BaseModel, Field


class EmploymentContext(BaseModel):
    resident_name: str = Field(min_length=1, max_length=60)
    objective: str = Field(min_length=2, max_length=160)
    acquired_skills: list[str] = Field(max_length=12)


class PlanStep(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    action: str = Field(min_length=1, max_length=300)
    timeframe: str = Field(min_length=1, max_length=80)


class PlanContent(BaseModel):
    summary: str = Field(min_length=1, max_length=600)
    strengths: list[str] = Field(min_length=1, max_length=5)
    gaps: list[str] = Field(min_length=1, max_length=4)
    cv_suggestions: list[str] = Field(min_length=1, max_length=4)
    steps: list[PlanStep] = Field(min_length=3, max_length=5)


class EmploymentPlan(PlanContent):
    source: Literal["ai", "guided"]
