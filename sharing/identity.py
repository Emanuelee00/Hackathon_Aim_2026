"""Which shared data an account owns, with the same rules as the pages.

The demo data lives in the frontend; test_sharing.py checks these mirrors against it.
"""

from accounts.models import User

# web/src/features/opportunities/data/residents.js: demo profiles, found by e-mail.
DEMO_RESIDENTS = {
    "marie@marthe.fr": "marie",
    "camille.b@marthe.fr": "camille",
    "sofia@marthe.fr": "sofia",
    "lea@marthe.fr": "lea",
}
# web/src/shared/data/associations.js: an association account bears its name.
ASSOCIATIONS = {
    "benenova": "Benenova",
    "sista4good": "Sista4good",
    "cantines": "Les Petites Cantines",
}
# web/src/shared/data/spaces.js: the pages drop every event if one has another space.
SPACES = frozenset(
    {
        "atelier",
        "salon",
        "cuisine",
        "chapelle",
        "jardin",
        "salon-collectif",
        "cantines",
        "reunion",
        "coworking",
        "nice-studio",
        "nice-verriere",
        "nice-terrasse",
        "avignon-cour",
        "avignon-bibliotheque",
    }
)


def resident_id(user: User) -> str:
    """Same rule as residentForUser: a demo profile, otherwise one profile per account."""
    return DEMO_RESIDENTS.get(user.email.lower(), f"user-{user.id}")


def association_id(user: User) -> str | None:
    name = user.name.strip().casefold()
    return next((id_ for id_, n in ASSOCIATIONS.items() if n.casefold() == name), None)


def same_person(name: str, user: User) -> bool:
    """Volunteer sign-ups are stored under the account name, as on the volunteer page."""
    return name.strip().casefold() == user.name.strip().casefold()
