"""Pydantic models and shared layout helpers for the document editor."""

from typing import Annotated, Literal

from equipe.quotes.facturation import ISSUER
from pydantic import BaseModel, Field, field_validator

Clean = Annotated[
    str, Field(max_length=20000, pattern=r"^[^\x00-\x08\x0b\x0c\x0e-\x1f]*$")
]


class Run(BaseModel):
    text: Clean
    bold: bool = False
    italic: bool = False
    underline: bool = False


Align = Literal["left", "center", "right", "justify"]


class Cell(BaseModel):
    runs: list[Run] = Field(default_factory=list, max_length=100)
    align: Align = "left"
    shade: Literal["none", "grey", "violet"] = "none"
    span: int = Field(default=1, ge=1, le=8)


class Block(BaseModel):
    kind: Literal["p", "h1", "h2", "ul", "ol", "table"] = "p"
    align: Align = "left"
    runs: list[Run] = Field(default_factory=list, max_length=500)
    rows: list[list[Cell]] = Field(default_factory=list, max_length=60)
    widths: list[float] = Field(default_factory=list, max_length=8)
    borders: Literal["grid", "none"] = "grid"

    @field_validator("rows")
    @classmethod
    def narrow_rows(cls, rows):
        if any(sum(cell.span for cell in row) > 8 for row in rows):
            raise ValueError("Un tableau a au plus 8 colonnes.")
        return rows


class Page(BaseModel):
    title: Annotated[str, Field(max_length=80)] = ""
    letterhead: bool = False
    logo: bool = False
    blocks: list[Block] = Field(max_length=2000)


def numbered(blocks: list[Block]) -> list[str]:
    """Return a bullet or 1-based marker for each list item."""
    markers, count = [], 0
    for block in blocks:
        count = count + 1 if block.kind == "ol" else 0
        markers.append(
            "• " if block.kind == "ul" else f"{count}. " if block.kind == "ol" else ""
        )
    return markers


def column_count(block: Block) -> int:
    return max((sum(cell.span for cell in row) for row in block.rows), default=0)


def column_widths(block: Block, columns: int) -> list[float]:
    given = [w for w in block.widths if w > 0][:columns]
    given += [sum(given) / len(given) if given else 1] * (columns - len(given))
    total = sum(given)
    return [width / total for width in given]


def letterhead_blocks() -> list[Block]:
    runs = [Run(text=ISSUER[0] + "\n", bold=True), Run(text="\n".join(ISSUER[1:]))]
    return [Block(runs=runs), Block()]
