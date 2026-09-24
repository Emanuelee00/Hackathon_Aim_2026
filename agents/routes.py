from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from accounts.models import User
from accounts.sessions import current_user
from db import get_session

from . import renseignements
from .llm import Context, run_agent
from .models import ChatReply, ChatRequest, Question, QuestionOut, QuestionUpdate

router = APIRouter(prefix="/api")
Db = Annotated[Session, Depends(get_session)]
# Each chatbot of the platform: add new agents here.
AGENTS = {agent.id: agent for agent in (renseignements.AGENT,)}


def team_member(user: Annotated[User, Depends(current_user)]) -> User:
    if user.role != "equipe":
        raise HTTPException(403, "Réservé à l’équipe.")
    return user


Team = Annotated[User, Depends(team_member)]


@router.post("/agents/{agent_id}/chat")
def chat(agent_id: str, request: ChatRequest, db: Db) -> ChatReply:
    if agent_id not in AGENTS:
        raise HTTPException(404, "Agent inconnu.")
    context = Context(db, [turn.model_dump() for turn in request.messages])
    try:
        return ChatReply(
            reply=run_agent(AGENTS[agent_id], context), handoff=context.handoff
        )
    except httpx.HTTPError as exc:
        # The question is saved: confirm it even if the final answer failed.
        if context.handoff:
            reply = f"Votre question est transmise à l’équipe (référence Q-{context.handoff})."
            return ChatReply(reply=reply, handoff=context.handoff)
        if isinstance(exc, httpx.TimeoutException):
            raise HTTPException(504, "L’assistant a mis trop de temps à répondre.")
        raise HTTPException(503, "L’assistant est indisponible pour le moment.")


@router.get("/questions")
def list_questions(db: Db, _: Team) -> list[QuestionOut]:
    return db.scalars(select(Question).order_by(Question.id.desc())).all()


@router.patch("/questions/{question_id}")
def update_question(
    question_id: int, update: QuestionUpdate, db: Db, _: Team
) -> QuestionOut:
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(404, "Question introuvable.")
    question.status = update.status
    db.commit()
    return question
