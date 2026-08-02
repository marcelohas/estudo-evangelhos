from __future__ import annotations

import re
from pathlib import Path

from lxml import etree


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "fonte-xml" / "catena.xml"
OUTPUT = ROOT / "traducao-pt" / "fontes-organizadas"
EXPECTED = {"Mark": 16, "Luke": 24, "John": 21}


def clean_text(element: etree._Element) -> str:
    text = " ".join("".join(element.itertext()).split())
    return text.replace("â€™", "’").replace("â€œ", "“").replace("â€", "”")


def main() -> None:
    tree = etree.parse(str(SOURCE))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    report: list[str] = ["# Auditoria da fonte XML", ""]

    for book, expected_count in EXPECTED.items():
        matches = tree.xpath(
            f'//*[local-name()="div" and @type="book" and @osisID="{book}"]'
        )
        if not matches:
            report.append(f"- {book}: livro ausente")
            continue

        chapters = matches[0].xpath('.//*[local-name()="chapter"]')
        ids = [chapter.get("osisID", "") for chapter in chapters]
        numbers = {
            int(match.group(1))
            for chapter_id in ids
            if (match := re.fullmatch(rf"{book}\.(\d+)", chapter_id))
        }
        missing = sorted(set(range(1, expected_count + 1)) - numbers)
        report.append(
            f"- {book}: {len(numbers)}/{expected_count} capítulos; "
            f"faltantes: {missing or 'nenhum'}"
        )

        book_dir = OUTPUT / book.lower()
        book_dir.mkdir(exist_ok=True)
        for chapter in chapters:
            chapter_id = chapter.get("osisID", "")
            match = re.fullmatch(rf"{book}\.(\d+)", chapter_id)
            if not match:
                continue
            number = int(match.group(1))
            title = f"# Catena Aurea - {book}, capítulo {number}\n\n"
            paragraphs = []
            for paragraph in chapter.xpath('.//*[local-name()="p"]'):
                text = clean_text(paragraph)
                if text:
                    paragraphs.append(text)
            (book_dir / f"capitulo-{number:02d}-en.md").write_text(
                title + "\n\n".join(paragraphs) + "\n", encoding="utf-8"
            )

    (OUTPUT / "AUDITORIA.md").write_text("\n".join(report) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
