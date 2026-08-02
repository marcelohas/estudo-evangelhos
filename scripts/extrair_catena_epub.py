from __future__ import annotations

import re
from pathlib import Path
from zipfile import ZipFile

from lxml import etree, html


ROOT = Path(__file__).resolve().parents[1]
EPUB = ROOT / "dokumen.pub_catena-aurea-volume-1-4.epub"
OUTPUT = ROOT / "traducao-pt" / "fontes-epub"
RANGES = {
    "mateus": range(4, 33),
    "marcos": range(33, 50),
    "lucas": range(50, 76),
    "joao": range(76, 98),
}
EXPECTED_CHAPTERS = {"mateus": 28, "marcos": 16, "lucas": 24, "joao": 21}


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def to_markdown(data: bytes) -> tuple[str, list[str]]:
    document = html.fromstring(data)
    etree.strip_elements(document, "style", "script", with_tail=False)
    blocks: list[str] = []
    headings: list[str] = []
    for element in document.xpath("//h1|//h2|//h3|//h4|//p"):
        text = normalize(element.text_content())
        if not text:
            continue
        if element.tag.lower().startswith("h"):
            level = int(element.tag[1])
            blocks.append(f"{'#' * level} {text}")
            headings.append(text)
        else:
            blocks.append(text)
    return "\n\n".join(blocks) + "\n", headings


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    report = ["# Auditoria do EPUB da Catena Aurea", ""]
    with ZipFile(EPUB) as archive:
        for gospel, indexes in RANGES.items():
            directory = OUTPUT / gospel
            directory.mkdir(exist_ok=True)
            all_headings: list[str] = []
            word_count = 0
            for index in indexes:
                source_name = f"CA complete_split_{index:03d}.htm"
                markdown, headings = to_markdown(archive.read(source_name))
                all_headings.extend(headings)
                word_count += len(markdown.split())
                (directory / f"secao-{index:03d}-en.md").write_text(
                    markdown, encoding="utf-8"
                )
            chapters = {
                int(match.group(1))
                for heading in all_headings
                if (match := re.fullmatch(r"Chap\.\s*(\d+)", heading, re.I))
            }
            expected = EXPECTED_CHAPTERS[gospel]
            missing = sorted(set(range(1, expected + 1)) - chapters)
            report.append(
                f"- {gospel.title()}: {len(chapters)}/{expected} capítulos; "
                f"{word_count:,} palavras; faltantes: {missing or 'nenhum'}"
            )
    (OUTPUT / "AUDITORIA.md").write_text("\n".join(report) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
