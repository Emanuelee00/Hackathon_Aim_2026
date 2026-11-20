"""Public-link mode: pre-written answers replace the local model.

The public API is unchanged: callers keep using
`from demo import DEMO_MODE, DEMO_DELAY, demo_plan, ...`.
"""

from .service import (
    DEMO_DELAY,
    DEMO_MODE,
    RESPONSES,
    demo_cv_lines,
    demo_plan,
    demo_rationales,
)

__all__ = [
    "DEMO_DELAY",
    "DEMO_MODE",
    "RESPONSES",
    "demo_cv_lines",
    "demo_plan",
    "demo_rationales",
]
