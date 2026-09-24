"""Creates an account from the command line (the only way to get a team account).

Usage: uv run python -m accounts.create_user EMAIL "NAME" ROLE
"""

import sys
from getpass import getpass
from typing import get_args

from sqlalchemy.orm import Session

from db import engine, migrate

from .models import Role, User
from .passwords import hash_password


def main(email: str, name: str, role: str) -> None:
    if role not in get_args(Role):
        sys.exit(f"Rôle inconnu : {role}. Choix : {', '.join(get_args(Role))}.")
    password = getpass("Mot de passe (8 caractères minimum) : ")
    if len(password) < 8:
        sys.exit("Mot de passe trop court.")
    migrate()
    with Session(engine) as db:
        db.add(
            User(
                email=email.strip().lower(),
                name=name.strip(),
                role=role,
                password_hash=hash_password(password),
            )
        )
        db.commit()
    print(f"Compte {role} créé pour {email}.")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
