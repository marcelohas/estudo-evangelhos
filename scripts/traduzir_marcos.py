from __future__ import annotations

import json
import re
import sqlite3
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GOSPEL = (sys.argv[1] if len(sys.argv) > 1 else "marcos").lower()
if GOSPEL not in {"marcos", "lucas", "joao"}:
    raise SystemExit("Use: marcos, lucas ou joao")
SOURCE = ROOT / "traducao-pt" / "fontes-epub" / GOSPEL
OUTPUT = ROOT / "traducao-pt" / f"{GOSPEL}-em-revisao"
CACHE = ROOT / "traducao-pt" / ".cache-traducao.sqlite3"
AUTH_ENDPOINT = "https://edge.microsoft.com/translate/auth"
ENDPOINT = (
    "https://api-edge.cognitive.microsofttranslator.com/translate"
    "?api-version=3.0&from=en&to=pt-br"
)
MAX_BATCH = 3400
ACCESS_TOKEN: str | None = None


TERMS = {
    "Gloss:": "Glosa:",
    "Pseudo-Jerome:": "Pseudo-Jerônimo:",
    "Pseudo-Chrysostom:": "Pseudo-Crisóstomo:",
    "Pseudo-Chrys.:": "Pseudo-Crisóstomo:",
    "Chrysostom:": "Crisóstomo:",
    "Theophylact:": "Teofilato:",
    "Augustine:": "Agostinho:",
    "Jerome:": "Jerônimo:",
    "Bede:": "Beda:",
    "Gregory:": "Gregório:",
}


def normalize_terms(text: str) -> str:
    for source, target in TERMS.items():
        text = text.replace(source, target)
    return text


def access_token(refresh: bool = False) -> str:
    global ACCESS_TOKEN
    if ACCESS_TOKEN is None or refresh:
        request = urllib.request.Request(
            AUTH_ENDPOINT, headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(request, timeout=45) as response:
            ACCESS_TOKEN = response.read().decode("utf-8").strip()
    return ACCESS_TOKEN


def request_translation(text: str) -> str:
    body = json.dumps([{"Text": text}], ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Authorization": f"Bearer {access_token()}",
            "Content-Type": "application/json; charset=UTF-8",
        },
        method="POST",
    )
    last_error: Exception | None = None
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                payload = json.loads(response.read().decode("utf-8"))
            return normalize_terms(payload[0]["translations"][0]["text"])
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code == 401:
                request.headers["Authorization"] = f"Bearer {access_token(True)}"
                continue
            if error.code == 429:
                wait = min(15 * (attempt + 1), 60)
                print(f"limite temporário; nova tentativa em {wait}s", flush=True)
                time.sleep(wait)
            else:
                time.sleep(min(2**attempt, 20))
        except Exception as error:
            last_error = error
            time.sleep(min(2**attempt, 20))
    raise RuntimeError(f"Translation failed after retries: {last_error}")


def cached_translation(connection: sqlite3.Connection, text: str) -> str | None:
    row = connection.execute(
        "SELECT translated FROM translations WHERE source = ?", (text,)
    ).fetchone()
    return row[0] if row else None


def save_translation(connection: sqlite3.Connection, source: str, translated: str) -> None:
    connection.execute(
        "INSERT OR REPLACE INTO translations(source, translated) VALUES (?, ?)",
        (source, translated),
    )


def translate_batch(connection: sqlite3.Connection, blocks: list[str]) -> list[str]:
    results: list[str | None] = [cached_translation(connection, block) for block in blocks]
    missing_indexes = [index for index, result in enumerate(results) if result is None]
    if not missing_indexes:
        return [result or "" for result in results]

    missing = [blocks[index] for index in missing_indexes]
    joined = "\n\n".join(missing)
    translated_joined = request_translation(joined)
    translated_parts = re.split(r"\n\s*\n", translated_joined.strip())

    if len(translated_parts) != len(missing):
        translated_parts = [request_translation(block) for block in missing]

    for index, source, translated in zip(missing_indexes, missing, translated_parts):
        translated = translated.strip()
        results[index] = translated
        save_translation(connection, source, translated)
    connection.commit()
    time.sleep(0.75)
    return [result or "" for result in results]


def batches(blocks: list[str]) -> list[list[str]]:
    output: list[list[str]] = []
    current: list[str] = []
    size = 0
    for block in blocks:
        addition = len(block) + (2 if current else 0)
        if current and size + addition > MAX_BATCH:
            output.append(current)
            current = []
            size = 0
        current.append(block)
        size += len(block) + (2 if len(current) > 1 else 0)
    if current:
        output.append(current)
    return output


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(CACHE)
    connection.execute(
        "CREATE TABLE IF NOT EXISTS translations "
        "(source TEXT PRIMARY KEY, translated TEXT NOT NULL)"
    )

    files = sorted(SOURCE.glob("*-en.md"))
    for file_index, source_path in enumerate(files, start=1):
        raw_blocks = [
            line.strip()
            for line in source_path.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        prefixes = []
        plain_blocks = []
        for block in raw_blocks:
            match = re.match(r"^(#{1,4})\s+(.*)$", block)
            prefixes.append((match.group(1) + " ") if match else "")
            plain_blocks.append(match.group(2) if match else block)

        translated_blocks: list[str] = []
        cursor = 0
        for batch in batches(plain_blocks):
            translated_blocks.extend(translate_batch(connection, batch))
            cursor += len(batch)
            print(
                f"{source_path.name}: {cursor}/{len(plain_blocks)} blocos",
                flush=True,
            )

        rendered = "\n\n".join(
            prefix + translated
            for prefix, translated in zip(prefixes, translated_blocks)
        ) + "\n"
        target = OUTPUT / source_path.name.replace("-en.md", "-pt.md")
        target.write_text(rendered, encoding="utf-8")
        print(f"arquivo {file_index}/{len(files)} concluído: {target.name}", flush=True)

    connection.close()


if __name__ == "__main__":
    main()
