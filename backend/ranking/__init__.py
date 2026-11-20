"""Ranking of resident profiles against an event, and the guided wording.

The public API is unchanged: callers keep using
`from ranking import rank_profiles, guided_rationale, stems, STOPWORDS`.
"""

from .service import STOPWORDS, guided_rationale, rank_profiles, shared_terms, stems

__all__ = [
    "STOPWORDS",
    "guided_rationale",
    "rank_profiles",
    "shared_terms",
    "stems",
]
