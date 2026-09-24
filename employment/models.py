from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


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


class CvEvent(BaseModel):
    id: str = Field(pattern=r"^[a-z0-9-]+$", max_length=40)
    title: str = Field(min_length=1, max_length=120)
    category: str = Field(default="", max_length=60)
    description: str = Field(default="", max_length=1200)
    opportunity: str = Field(default="", max_length=600)


class CvProposal(BaseModel):
    event_id: str
    rationale: str
    benefit: str
    vigilance: str


class EmploymentPlan(PlanContent):
    source: Literal["ai", "guided"]
    proposals: list[CvProposal] = []


class CvSkill(BaseModel):
    skill: str = Field(min_length=1, max_length=200)
    event: str = Field(min_length=1, max_length=120)
    date: str = Field(min_length=1, max_length=40)


class CvLinesRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    objective: str = Field(min_length=2, max_length=160)
    skills: list[CvSkill] = Field(min_length=1, max_length=8)


class CvLine(BaseModel):
    skill: str
    line: str = Field(min_length=1, max_length=300)


class CvLinesContent(BaseModel):
    lines: list[CvLine] = Field(min_length=1, max_length=8)
    advice: str = Field(min_length=1, max_length=400)


class CvLines(CvLinesContent):
    source: Literal["ai", "guided"]
