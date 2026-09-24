"""Server-side sessions kept in an httpOnly cookie."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Request, Response
from sqlalchemy import delete
from sqlalchemy.orm import Session

from db import get_session

from .models import User, UserSession

COOKIE = "marthe_session"
LIFETIME = timedelta(days=30)


def _digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def open_session(db: Session, user: User, request: Request, response: Response):
    token = secrets.token_urlsafe(32)
    db.add(
        UserSession(
            token_hash=_digest(token),
            user_id=user.id,
            expires_at=datetime.now(UTC) + LIFETIME,
        )
    )
    db.commit()
    # Host-only cookie: each subdomain keeps its own sign-in.
    response.set_cookie(
        COOKIE,
        token,
        max_age=int(LIFETIME.total_seconds()),
        httponly=True,
        samesite="lax",
        secure=request.url.scheme == "https",
    )


def close_session(db: Session, token: str | None, response: Response) -> None:
    if token:
        db.execute(delete(UserSession).where(UserSession.token_hash == _digest(token)))
        db.commit()
    response.delete_cookie(COOKIE)


def current_user(
    db: Annotated[Session, Depends(get_session)],
    token: Annotated[str | None, Cookie(alias=COOKIE)] = None,
) -> User:
    session = token and db.get(UserSession, _digest(token))
    # SQLite returns naive datetimes (stored in UTC), Postgres aware ones.
    expires = session and session.expires_at.replace(
        tzinfo=session.expires_at.tzinfo or UTC
    )
    if not session or expires < datetime.now(UTC):
        raise HTTPException(401, "Veuillez vous connecter.")
    return db.get(User, session.user_id)
