from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from db import Base

# One role per subdomain; a user signs in on the space of their role.
Role = Literal["equipe", "residents", "benevoles", "partenaires"]
# Team accounts are created from the command line only (the team sees residents' data).
OPEN_SIGNUP = {"benevoles"}
# Residents and associations submit a request that a team member validates.
REQUEST_SIGNUP = {"residents", "partenaires"}
Status = Literal["pending", "active"]


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(20))
    password_hash: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(10), default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UserSession(Base):
    __tablename__ = "sessions"

    # SHA-256 of the cookie token: a leaked table does not give usable sessions.
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Credentials(BaseModel):
    # No whitespace stripping here: it would silently change passwords.
    email: str = Field(max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)
    space: Role


class Registration(Credentials):
    name: str = Field(min_length=1, max_length=120)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    name: str
    role: Role


class AccountRequest(UserOut):
    created_at: datetime
