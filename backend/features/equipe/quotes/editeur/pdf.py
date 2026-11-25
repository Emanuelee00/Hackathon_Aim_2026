"""PDF document generation for the document editor."""

from html import escape as html_escape

from fpdf import FPDF
from fpdf.fonts import FontFace, TextStyle

from features.equipe.quotes.facturation import FOLDER, GREY, VIOLET

from .models import (
    Block,
    Page,
    column_count,
    column_widths,
    letterhead_blocks,
    numbered,
)


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
