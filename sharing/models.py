from datetime import UTC, datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from .identity import SPACES

Text = Annotated[str, Field(max_length=4000)]
Time = Annotated[str, Field(pattern=r"^\d{2}:\d{2}$")]


def known_space(space: str) -> str:
    if space not in SPACES:
        raise ValueError("Espace inconnu.")
    return space


class EventDraft(BaseModel):
    """A request written outside the team: only these fields are kept."""

    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=120)
    space: Annotated[str, AfterValidator(known_space)]
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    start: Time
    end: Time
    participants: int = Field(default=0, ge=0, le=2000)
    requestType: Literal["programming", "rental"] = "rental"
    privatisation: bool = False
    duration: str = Field(default="", max_length=20)
    technical: list[Annotated[str, Field(max_length=20)]] = Field(
        default=[], max_length=10
    )
    openToResidents: bool = False
    category: str = Field(default="", max_length=60)
    organizer: str = Field(default="", max_length=120)
    email: str = Field(default="", max_length=254)
    description: Text = ""
    opportunity: Text = ""
    rentalUse: Text = ""
    equipmentNeeds: Text = ""
    budgetDetails: Text = ""
    revenue: int = Field(default=0, ge=0, le=100_000)

    def as_event(self, event_id: str, **forced) -> dict:
        """A pending request in the team's queue; the team fields start empty."""
        return {
            **self.model_dump(),
            "audience": "",
            "missionFit": "",
            "supportNeeds": "",
            "referent": "",
            "referentTeam": "",
            "costs": 0,
            "tasks": [],
            "report": None,
            **forced,
            "id": event_id,
            "status": "pending",
            "submittedAt": datetime.now(UTC).isoformat(),
        }


class Feedback(BaseModel):
    """The organiser's bilan, same questions as the form."""

    rating: int = Field(ge=1, le=5)
    attendance: int = Field(ge=0, le=100_000)
    residents: Literal["yes", "no", "unknown"]
    logistics: Literal["", "ready", "adjust", "issues"] = ""
    comment: str = Field(default="", max_length=1000)
