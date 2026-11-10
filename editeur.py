"""Free editor of « Factures et devis »: the team writes a document on the page and downloads it in Word or PDF.

The page sends the text as blocks (paragraph, titles, list items) made of runs (bold, italic, underlined); this module turns them into
a .docx file (written by hand, no template) or a PDF. Nothing is stored.
"""

import zipfile
from html import escape as html_escape
from io import BytesIO
from typing import Annotated, Literal
from urllib.parse import quote
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from fpdf import FPDF
from fpdf.fonts import FontFace, TextStyle
from pydantic import BaseModel, Field, field_validator

from accounts.models import User
from accounts.sessions import team_member
from modeles import FOLDER, FORMATS, GREY, ISSUER, VIOLET

router = APIRouter(prefix="/api/editeur")
Team = Annotated[User, Depends(team_member)]
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
    shade: Literal["none", "grey", "violet"] = "none"  # violet: header, white bold text
    span: int = Field(default=1, ge=1, le=8)  # columns the cell covers


class Block(BaseModel):
    kind: Literal["p", "h1", "h2", "ul", "ol", "table"] = "p"
    align: Align = "left"
    runs: list[Run] = Field(default_factory=list, max_length=500)
    rows: list[list[Cell]] = Field(default_factory=list, max_length=60)  # table only
    widths: list[float] = Field(
        default_factory=list, max_length=8
    )  # relative column widths
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


SIZES = {"p": 22, "ul": 22, "ol": 22, "h1": 40, "h2": 30}  # half-points, as Word counts
ALIGN = {"left": "left", "center": "center", "right": "right", "justify": "both"}
HEAD = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>'
)
LOGO_WIDTH, LOGO_HEIGHT = 1_400_000, 990_000  # EMU
LOGO = (
    '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">'
    f'<wp:extent cx="{LOGO_WIDTH}" cy="{LOGO_HEIGHT}"/><wp:docPr id="1" name="Logo Chez Marthe"/>'
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>'
    '<pic:nvPicPr><pic:cNvPr id="0" name="logo.jpg"/><pic:cNvPicPr/></pic:nvPicPr>'
    '<pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
    f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{LOGO_WIDTH}" cy="{LOGO_HEIGHT}"/></a:xfrm>'
    '<a:prstGeom prst="rect"/></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
)
CONTENT_WIDTH = 9638  # twips: A4 minus the margins
TAIL = (
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720"/></w:sectPr>'
    "</w:body></w:document>"
)


def numbered(blocks: list[Block]) -> list[str]:
    """The marker written before each list item: a bullet, or 1. 2. 3. restarting after each list."""
    markers, count = [], 0
    for block in blocks:
        count = count + 1 if block.kind == "ol" else 0
        markers.append(
            "• " if block.kind == "ul" else f"{count}. " if block.kind == "ol" else ""
        )
    return markers


def word_run(run: Run, kind: str, color: str | None = None) -> str:
    props = "".join(
        (
            '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>',
            "<w:b/>" if run.bold or kind in ("h1", "h2") else "",
            "<w:i/>" if run.italic else "",
            '<w:u w:val="single"/>' if run.underline else "",
            f'<w:color w:val="{color}"/>' if color else "",
            f'<w:sz w:val="{SIZES[kind]}"/>',
        )
    )
    body = "<w:br/>".join(
        f'<w:t xml:space="preserve">{escape(part)}</w:t>'
        for part in run.text.split("\n")
    )
    return f"<w:r><w:rPr>{props}</w:rPr>{body}</w:r>"


def word_paragraph(block: Block, marker: str) -> str:
    indent = '<w:ind w:left="567" w:hanging="283"/>' if marker else ""
    spacing = (
        '<w:spacing w:before="240" w:after="120"/>'
        if block.kind in ("h1", "h2")
        else '<w:spacing w:after="100"/>'
    )
    runs = ([Run(text=marker)] if marker else []) + block.runs
    color = "682A7F" if block.kind in ("h1", "h2") else None
    inner = "".join(word_run(run, block.kind, color) for run in runs)
    return f'<w:p><w:pPr>{spacing}{indent}<w:jc w:val="{ALIGN[block.align]}"/></w:pPr>{inner}</w:p>'


def column_count(block: Block) -> int:
    return max((sum(cell.span for cell in row) for row in block.rows), default=0)


def column_widths(block: Block, columns: int) -> list[float]:
    given = [w for w in block.widths if w > 0][:columns]
    given += [sum(given) / len(given) if given else 1] * (columns - len(given))
    total = sum(given)
    return [width / total for width in given]


def word_cell(cell: Cell, width: float) -> str:
    span = f'<w:gridSpan w:val="{cell.span}"/>' if cell.span > 1 else ""
    violet = cell.shade == "violet"
    runs = [
        run.model_copy(update={"bold": run.bold or violet}) for run in cell.runs
    ] or [Run(text="")]
    fill = {"violet": "682A7F", "grey": "D9D9D9"}.get(cell.shade)
    shading = f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>' if fill else ""
    inner = "".join(word_run(run, "p", "FFFFFF" if violet else None) for run in runs)
    return (
        f'<w:tc><w:tcPr><w:tcW w:w="{round(width * CONTENT_WIDTH)}" w:type="dxa"/>{span}{shading}</w:tcPr>'
        f'<w:p><w:pPr><w:spacing w:before="40" w:after="40"/><w:jc w:val="{ALIGN[cell.align]}"/></w:pPr>{inner}</w:p></w:tc>'
    )


def word_table(block: Block) -> str:
    columns = min(column_count(block), 8)
    if not columns:
        return ""
    widths = column_widths(block, columns)
    line = "single" if block.borders == "grid" else "nil"
    edges = "".join(
        f'<w:{edge} w:val="{line}" w:sz="4" w:space="0" w:color="C0C0C0"/>'
        for edge in ("top", "left", "bottom", "right", "insideH", "insideV")
    )
    grid = "".join(f'<w:gridCol w:w="{round(w * CONTENT_WIDTH)}"/>' for w in widths)
    rows = ""
    for row in block.rows:
        rows += "<w:tr>"
        column = 0
        for cell in row:
            if column >= columns:
                break
            span = min(cell.span, columns - column)
            rows += word_cell(
                cell.model_copy(update={"span": span}),
                sum(widths[column : column + span]),
            )
            column += span
        if column < columns:
            rows += word_cell(Cell(span=columns - column), sum(widths[column:]))
        rows += "</w:tr>"
    return (
        f'<w:tbl><w:tblPr><w:tblW w:w="{CONTENT_WIDTH}" w:type="dxa"/><w:tblBorders>{edges}</w:tblBorders>'
        '<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar>'
        f"</w:tblPr><w:tblGrid>{grid}</w:tblGrid>{rows}</w:tbl><w:p/>"
    )


def letterhead_blocks() -> list[Block]:
    runs = [Run(text=ISSUER[0] + "\n", bold=True), Run(text="\n".join(ISSUER[1:]))]
    return [Block(runs=runs), Block()]


def make_docx(page: Page) -> bytes:
    blocks = (letterhead_blocks() if page.letterhead else []) + page.blocks
    body = LOGO if page.logo else ""
    body += "".join(
        word_table(block) if block.kind == "table" else word_paragraph(block, marker)
        for block, marker in zip(blocks, numbered(blocks), strict=True)
    )
    files = {
        "[Content_Types].xml": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Default Extension="jpg" ContentType="image/jpeg"/>'
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            "</Types>"
        ),
        "_rels/.rels": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            "</Relationships>"
        ),
        "word/document.xml": HEAD + body + TAIL,
        "word/_rels/document.xml.rels": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.jpg"/>'
            "</Relationships>"
        ),
    }
    output = BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as target:
        for name, content in files.items():
            target.writestr(name, content)
        if page.logo:
            target.write(FOLDER / "logo.jpg", "word/media/logo.jpg")
    return output.getvalue()


def pdf_html(block: Block, marker: str) -> str:
    text = ""
    for run in block.runs:
        part = html_escape(run.text).replace("\n", "<br>")
        for tag, on in (("u", run.underline), ("i", run.italic), ("b", run.bold)):
            if on:
                part = f"<{tag}>{part}</{tag}>"
        text += part
    text = marker + text
    align = f' align="{block.align}"'
    if block.kind in ("h1", "h2"):
        return f"<{block.kind}{align}>{text}</{block.kind}>"
    return f"<p{align}>{text or '&nbsp;'}</p>"


def pdf_table(pdf: FPDF, block: Block) -> None:
    columns = min(column_count(block), 8)
    if not columns:
        return
    widths = column_widths(block, columns)
    pdf.set_x(pdf.l_margin)
    pdf.set_draw_color(192, 192, 192)
    pdf.set_font("Sans", size=10)
    usable = pdf.w - pdf.l_margin - pdf.r_margin
    with pdf.table(
        col_widths=tuple(width * usable for width in widths),
        width=usable,
        borders_layout="ALL" if block.borders == "grid" else "NONE",
        line_height=6,
        first_row_as_headings=False,
        padding=(1.2, 1.5),
    ) as table:
        for row in block.rows:
            line = table.row()
            column = 0
            for cell in row:
                if column >= columns:
                    break
                span = min(cell.span, columns - column)
                column += span
                text = "".join(run.text for run in cell.runs)
                bold = bool(cell.runs) and all(run.bold for run in cell.runs)
                if cell.shade == "violet":
                    style = FontFace(
                        emphasis="BOLD", color=(255, 255, 255), fill_color=VIOLET
                    )
                elif cell.shade == "grey":
                    style = FontFace(emphasis="BOLD" if bold else None, fill_color=GREY)
                else:
                    style = FontFace(emphasis="BOLD" if bold else None)
                line.cell(text, align=cell.align.upper(), style=style, colspan=span)
            while column < columns:
                line.cell("")
                column += 1
    pdf.ln(3)


def make_pdf(page: Page) -> bytes:
    blocks = (letterhead_blocks() if page.letterhead else []) + page.blocks
    pdf = FPDF(format="A4")
    pdf.set_margins(20, 12, 20)
    pdf.set_auto_page_break(True, 18)
    for style, name in (
        ("", "DejaVuSans"),
        ("B", "DejaVuSans-Bold"),
        ("I", "DejaVuSans-Oblique"),
        ("BI", "DejaVuSans-BoldOblique"),
    ):
        pdf.add_font("Sans", style, str(FOLDER / "fonts" / f"{name}.ttf"))
    pdf.add_page()
    pdf.set_font("Sans", size=10.5)
    if page.logo:
        pdf.image(str(FOLDER / "logo.jpg"), x=20, y=12, w=38)
        pdf.set_y(12 + 38 * 905 / 1280 + 4)
    styles = {
        "h1": TextStyle(
            font_size_pt=20, font_style="B", color=VIOLET, t_margin=4, b_margin=2
        ),
        "h2": TextStyle(
            font_size_pt=15, font_style="B", color=VIOLET, t_margin=3, b_margin=1.5
        ),
    }
    pending: list[str] = []

    def flush() -> None:
        if pending:
            pdf.set_x(pdf.l_margin)
            pdf.set_font("Sans", size=10.5)
            pdf.write_html("".join(pending), tag_styles=styles)
            pending.clear()

    for block, marker in zip(blocks, numbered(blocks), strict=True):
        if block.kind == "table":
            flush()
            pdf_table(pdf, block)
        else:
            pending.append(pdf_html(block, marker))
    flush()
    return bytes(pdf.output())


@router.post("/{extension}")
def download(extension: str, page: Page, user: Team) -> Response:
    """The document written in the editor, as a Word or PDF file."""
    if extension not in FORMATS:
        raise HTTPException(404, "Format introuvable.")
    content = make_docx(page) if extension == "docx" else make_pdf(page)
    name = (page.title.strip() or "Document").replace("/", "-")
    return Response(
        content,
        media_type=FORMATS[extension],
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(name)}.{extension}"
        },
    )
