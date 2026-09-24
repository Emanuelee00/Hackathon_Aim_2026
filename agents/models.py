from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import JSON, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from db import Base

QuestionStatus = Literal["new", "done"]


class Question(Base):
    """A question an agent handed off to the team, with the conversation behind it."""

    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    agent: Mapped[str] = mapped_column(String(40))
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254))
    summary: Mapped[str] = mapped_column(Text)
    transcript: Mapped[list] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(10), default="new")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Turn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    messages: list[Turn] = Field(min_length=1, max_length=30)


class ChatReply(BaseModel):
    reply: str
    # Reference of the question handed off to the team during this turn, if any.
    handoff: int | None = None


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    agent: str
    name: str
    email: str
    summary: str
    transcript: list
    status: QuestionStatus
    created_at: datetime


class QuestionUpdate(BaseModel):
    status: QuestionStatus
