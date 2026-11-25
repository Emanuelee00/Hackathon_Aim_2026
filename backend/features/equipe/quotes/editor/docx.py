"""Word document generation for the document editor."""

import zipfile
from io import BytesIO
from xml.sax.saxutils import escape

from features.equipe.quotes.invoicing import FOLDER

from .models import (
    Block,
    Cell,
    Page,
    Run,
    column_count,
    column_widths,
    letterhead_blocks,
    numbered,
)

SIZES = {"p": 22, "ul": 22, "ol": 22, "h1": 40, "h2": 30}
ALIGN = {"left": "left", "center": "center", "right": "right", "justify": "both"}
HEAD = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>'
)
LOGO_WIDTH, LOGO_HEIGHT = 1_400_000, 990_000
LOGO = (
    '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">'
    f'<wp:extent cx="{LOGO_WIDTH}" cy="{LOGO_HEIGHT}"/><wp:docPr id="1" name="Logo Chez Marthe"/>'
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>'
    '<pic:nvPicPr><pic:cNvPr id="0" name="logo.jpg"/><pic:cNvPicPr/></pic:nvPicPr>'
    '<pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
    f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{LOGO_WIDTH}" cy="{LOGO_HEIGHT}"/></a:xfrm>'
    '<a:prstGeom prst="rect"/></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
)
CONTENT_WIDTH = 9638
TAIL = (
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720"/></w:sectPr>'
    "</w:body></w:document>"
)


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
