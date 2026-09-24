"""Creates the demo accounts listed in comptes.txt; existing addresses are left untouched.

Usage: uv run python -m accounts.seed_demo
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from db import engine, migrate

from .models import User
from .passwords import hash_password

PASSWORD = "marthe2026"
# The resident emails match the demo profiles in web/src/features/opportunities/data/residents.js.
ACCOUNTS = [
    ("equipe@marthe.fr", "Coordinatrice", "equipe"),
    ("marie@marthe.fr", "Marie", "residents"),
    ("camille.b@marthe.fr", "Camille", "residents"),
    ("sofia@marthe.fr", "Sofia", "residents"),
    ("camille@marthe.fr", "Camille", "benevoles"),
    ("benenova@marthe.fr", "Benenova", "partenaires"),
]


def main() -> None:
    migrate()
    with Session(engine) as db:
        existing = set(db.scalars(select(User.email)))
        for email, name, role in ACCOUNTS:
            if email in existing:
                print(f"Déjà présent : {email}")
                continue
            db.add(
                User(
                    email=email,
                    name=name,
                    role=role,
                    password_hash=hash_password(PASSWORD),
                )
            )
            print(f"Compte {role} créé pour {email}.")
        db.commit()


if __name__ == "__main__":
    main()
