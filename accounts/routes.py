from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db import get_session

from .models import (
    OPEN_SIGNUP,
    REQUEST_SIGNUP,
    AccountRequest,
    Credentials,
    Registration,
    User,
    UserOut,
)
from .passwords import DUMMY_HASH, hash_password, verify_password
from .sessions import COOKIE, close_session, current_user, open_session, team_member

router = APIRouter(prefix="/api/auth")
Db = Annotated[Session, Depends(get_session)]
Team = Annotated[User, Depends(team_member)]
PENDING_MESSAGE = "Votre demande est en attente de validation par l’équipe."


@router.post("/register", status_code=201)
def register(form: Registration, db: Db, request: Request, response: Response):
    if form.space not in OPEN_SIGNUP | REQUEST_SIGNUP:
        raise HTTPException(403, "Les comptes de cet espace sont créés par l’équipe.")
    pending = form.space in REQUEST_SIGNUP
    user = User(
        email=form.email.lower(),
        name=form.name.strip(),
        role=form.space,
        password_hash=hash_password(form.password),
        status="pending" if pending else "active",
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        raise HTTPException(409, "Un compte existe déjà avec cette adresse.")
    if pending:
        response.status_code = 202
        return {"pending": True, "detail": PENDING_MESSAGE}
    open_session(db, user, request, response)
    return UserOut.model_validate(user)


@router.post("/login")
def login(form: Credentials, db: Db, request: Request, response: Response):
    user = db.scalars(select(User).where(User.email == form.email.lower())).first()
    valid = verify_password(form.password, user.password_hash if user else DUMMY_HASH)
    # Same message for every failure, so the form does not reveal who has an account.
    if not (user and valid and user.role == form.space):
        raise HTTPException(401, "Adresse ou mot de passe incorrect pour cet espace.")
    if user.status != "active":
        raise HTTPException(403, PENDING_MESSAGE)
    open_session(db, user, request, response)
    return UserOut.model_validate(user)


@router.post("/logout", status_code=204)
def logout(
    db: Db,
    response: Response,
    token: Annotated[str | None, Cookie(alias=COOKIE)] = None,
):
    close_session(db, token, response)


@router.get("/me")
def me(user: Annotated[User, Depends(current_user)]) -> UserOut:
    return UserOut.model_validate(user)


@router.get("/requests")
def list_requests(db: Db, _: Team) -> list[AccountRequest]:
    query = select(User).where(User.status == "pending").order_by(User.created_at)
    return db.scalars(query).all()


def _pending(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user or user.status != "pending":
        raise HTTPException(404, "Demande introuvable.")
    return user


@router.post("/requests/{user_id}/approve")
def approve_request(user_id: int, db: Db, _: Team) -> UserOut:
    user = _pending(db, user_id)
    user.status = "active"
    db.commit()
    return UserOut.model_validate(user)


@router.delete("/requests/{user_id}", status_code=204)
def reject_request(user_id: int, db: Db, _: Team):
    db.delete(_pending(db, user_id))
    db.commit()
