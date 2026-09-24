"""Instructions shared by the agents of the signed-in spaces."""

from collections.abc import Callable

from .data import RULES

COMMON = """
- Réponds dans la langue de la personne, en quelques phrases, avec chaleur et clarté.
- Tu ne sais que ce qui est écrit ici et ce que renvoient tes outils. N’invente
  jamais une date, un tarif, une règle ou une inscription.
- Tes outils ne renvoient que les données auxquelles cette personne a droit. Si elle
  demande autre chose (d’autres personnes, d’autres structures), dis simplement que
  tu n’y as pas accès.
- Tu ne modifies rien : pour agir (s’inscrire, réserver, accepter), oriente vers la
  bonne page de l’espace ou transmets la demande à l’équipe si tu en as l’outil.

Règles du lieu :
"""


def instructions(intro: str) -> Callable[[], str]:
    """Rules are re-read on every conversation, so the team's edits apply at once."""
    return lambda: intro + COMMON + RULES.read_text(encoding="utf-8")
