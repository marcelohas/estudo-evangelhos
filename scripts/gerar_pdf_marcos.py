from __future__ import annotations

import re
import sys
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
GOSPEL = (sys.argv[1] if len(sys.argv) > 1 else "marcos").lower()
GOSPELS = {
    "marcos": ("São Marcos", "Sao Marcos"),
    "lucas": ("São Lucas", "Sao Lucas"),
    "joao": ("São João", "Sao Joao"),
}
if GOSPEL not in GOSPELS:
    raise SystemExit("Use: marcos, lucas ou joao")
DISPLAY_GOSPEL, FILE_GOSPEL = GOSPELS[GOSPEL]
SOURCE = ROOT / "traducao-pt" / f"{GOSPEL}-em-revisao"
OUTPUT = ROOT / "traducao-pt" / f"Catena Aurea - Evangelho de {FILE_GOSPEL} - PT-BR.pdf"
PAGE_SIZE = (160 * mm, 230 * mm)


def register_fonts() -> None:
    font_dir = Path(r"C:\Windows\Fonts")
    pdfmetrics.registerFont(TTFont("Georgia", str(font_dir / "georgia.ttf")))
    pdfmetrics.registerFont(TTFont("Georgia-Bold", str(font_dir / "georgiab.ttf")))
    pdfmetrics.registerFont(TTFont("Georgia-Italic", str(font_dir / "georgiai.ttf")))
    pdfmetrics.registerFontFamily(
        "Georgia", normal="Georgia", bold="Georgia-Bold", italic="Georgia-Italic"
    )


class CatenaDocument(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(
            filename,
            pagesize=PAGE_SIZE,
            leftMargin=17 * mm,
            rightMargin=17 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
            title=f"Catena Aurea - Evangelho segundo {DISPLAY_GOSPEL}",
            author="Santo Tomás de Aquino",
            subject=f"Tradução brasileira da Catena Aurea sobre o Evangelho segundo {DISPLAY_GOSPEL}",
        )
        frame = self._make_frame()
        self.addPageTemplates(
            [
                PageTemplate(id="cover", frames=frame, onPage=self.cover_page),
                PageTemplate(id="body", frames=frame, onPage=self.body_page),
            ]
        )

    def _make_frame(self):
        from reportlab.platypus import Frame

        return Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="main",
        )

    @staticmethod
    def cover_page(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#7A5C28"))
        canvas.rect(0, 0, 8 * mm, PAGE_SIZE[1], fill=1, stroke=0)
        canvas.restoreState()

    @staticmethod
    def body_page(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFont("Georgia", 7.5)
        canvas.setFillColor(colors.HexColor("#6E6254"))
        canvas.drawString(17 * mm, PAGE_SIZE[1] - 10 * mm, f"CATENA AUREA - {DISPLAY_GOSPEL.upper()}")
        canvas.drawRightString(PAGE_SIZE[0] - 17 * mm, 10 * mm, str(doc.page))
        canvas.setStrokeColor(colors.HexColor("#D5C7AF"))
        canvas.line(17 * mm, PAGE_SIZE[1] - 12 * mm, PAGE_SIZE[0] - 17 * mm, PAGE_SIZE[1] - 12 * mm)
        canvas.restoreState()

    def afterFlowable(self, flowable) -> None:
        if not isinstance(flowable, Paragraph):
            return
        style = flowable.style.name
        if style not in {"Chapter", "Pericope"}:
            return
        level = 0 if style == "Chapter" else 1
        text = flowable.getPlainText()
        key = f"heading-{self.seq.nextf('heading')}"
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(text, key, level=level, closed=level > 0)
        self.notify("TOCEntry", (level, text, self.page, key))


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "TitleCustom",
            parent=base["Title"],
            fontName="Georgia-Bold",
            fontSize=23,
            leading=29,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#3C2C18"),
            spaceAfter=8 * mm,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="Georgia",
            fontSize=12,
            leading=17,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#7A5C28"),
        ),
        "note": ParagraphStyle(
            "Note",
            parent=base["Normal"],
            fontName="Georgia-Italic",
            fontSize=8.2,
            leading=12,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#655A4B"),
        ),
        "toc_title": ParagraphStyle(
            "TOCTitle",
            parent=base["Heading1"],
            fontName="Georgia-Bold",
            fontSize=17,
            leading=21,
            textColor=colors.HexColor("#3C2C18"),
            spaceAfter=6 * mm,
        ),
        "chapter": ParagraphStyle(
            "Chapter",
            parent=base["Heading1"],
            fontName="Georgia-Bold",
            fontSize=17,
            leading=21,
            textColor=colors.HexColor("#5D421D"),
            spaceBefore=4 * mm,
            spaceAfter=4 * mm,
            keepWithNext=True,
        ),
        "pericope": ParagraphStyle(
            "Pericope",
            parent=base["Heading2"],
            fontName="Georgia-Bold",
            fontSize=11.5,
            leading=15,
            textColor=colors.HexColor("#7A5C28"),
            spaceBefore=3.5 * mm,
            spaceAfter=2 * mm,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Georgia",
            fontSize=8.7,
            leading=12.6,
            alignment=TA_JUSTIFY,
            firstLineIndent=4 * mm,
            spaceAfter=2.2 * mm,
            allowWidows=0,
            allowOrphans=0,
        ),
        "preface": ParagraphStyle(
            "Chapter",
            parent=base["Heading1"],
            fontName="Georgia-Bold",
            fontSize=17,
            leading=21,
            textColor=colors.HexColor("#5D421D"),
            spaceAfter=4 * mm,
        ),
    }


def enrich_body(text: str) -> str:
    safe = escape(text)
    match = re.match(r"^([^.:]{2,55}[.:])\s+(.*)$", safe, re.S)
    if match and not match.group(1).startswith(("Vers.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.")):
        return f"<b>{match.group(1)}</b> {match.group(2)}"
    if safe.startswith("Vers. "):
        return f"<i>{safe}</i>"
    return safe


def build_story() -> list:
    style = styles()
    story = [
        Spacer(1, 35 * mm),
        Paragraph("CATENA AUREA", style["title"]),
        Paragraph(f"Evangelho segundo {DISPLAY_GOSPEL}", style["subtitle"]),
        Spacer(1, 10 * mm),
        Paragraph("Santo Tomás de Aquino", style["subtitle"]),
        Spacer(1, 35 * mm),
        Paragraph(
            "Tradução brasileira produzida a partir da transcrição inglesa estruturada "
            "da edição de Oxford, com uniformização dos nomes patrísticos, das divisões "
            "do Evangelho e da terminologia recorrente.",
            style["note"],
        ),
        NextPageTemplate("body"),
        PageBreak(),
        Paragraph("Sumário", style["toc_title"]),
    ]
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            "TOCChapter",
            fontName="Georgia-Bold",
            fontSize=9.5,
            leading=14,
            leftIndent=0,
            firstLineIndent=0,
            textColor=colors.HexColor("#4B3820"),
        ),
        ParagraphStyle(
            "TOCPericope",
            fontName="Georgia",
            fontSize=7.5,
            leading=10,
            leftIndent=7 * mm,
            firstLineIndent=0,
            textColor=colors.HexColor("#6E6254"),
        ),
    ]
    story.extend([toc, PageBreak()])

    for path in sorted(SOURCE.glob("*-pt.md")):
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            if line.startswith("# "):
                story.append(Paragraph(escape(line[2:]), style["preface"]))
            elif line.startswith("## "):
                story.extend([PageBreak(), Paragraph(escape(line[3:]), style["chapter"])])
            elif line.startswith("### "):
                story.append(Paragraph(escape(line[4:]), style["pericope"]))
            else:
                story.append(Paragraph(enrich_body(line), style["body"]))
    return story


def main() -> None:
    register_fonts()
    document = CatenaDocument(str(OUTPUT))
    document.multiBuild(build_story())
    print(OUTPUT)


if __name__ == "__main__":
    main()
