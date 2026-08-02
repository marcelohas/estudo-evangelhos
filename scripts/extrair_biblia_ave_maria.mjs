import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "Portugues-Catolica-AVM-All-Bible.pdf");
const output = join(root, "content", "generated", "bible", "pt-BR");
const books = [
  { name: "Mateus", heading: "São Mateus", slug: "mateus", abbr: "mt", pages: [2277, 2354], chapters: 28 },
  { name: "Marcos", heading: "São Marcos", slug: "marcos", abbr: "mc", pages: [2355, 2405], chapters: 16 },
  { name: "Lucas", heading: "São Lucas", slug: "lucas", abbr: "lc", pages: [2406, 2491], chapters: 24 },
  { name: "João", heading: "São João", slug: "joao", abbr: "jo", pages: [2492, 2556], chapters: 21 },
];

async function findPdfJs() {
  const candidates = [
    process.env.PDFJS_DIST_PATH,
    join(root, "frontend", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs"),
    process.env.USERPROFILE && join(
      process.env.USERPROFILE, ".cache", "codex-runtimes", "codex-primary-runtime",
      "dependencies", "node", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs",
    ),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch { /* tenta o próximo local */ }
  }
  throw new Error("pdfjs-dist não encontrado. Defina PDFJS_DIST_PATH para legacy/build/pdf.mjs.");
}

function cleanVerse(parts) {
  return parts.join(" ").replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(=\s*[^)]*\)/g, "")
    .replace(/\s+-\s+(?=\p{L})/gu, "-")
    .trim();
}

async function extractBook(document, book) {
  const verses = [];
  let chapter;
  let current;
  const chapterPattern = new RegExp(`^${book.heading}\\s+(\\d+)$`);

  function finishVerse() {
    if (!current) return;
    const text = cleanVerse(current.parts);
    if (text) verses.push({
      id: `${book.abbr}-${current.chapter}-${current.verse}`,
      book: book.name,
      chapter: current.chapter,
      verse: current.verse,
      reference: `${book.name} ${current.chapter},${current.verse}`,
      text,
    });
    current = undefined;
  }

  for (let pageNumber = book.pages[0]; pageNumber <= book.pages[1]; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      const value = item.str?.trim();
      if (!value) continue;
      const x = item.transform?.[4] ?? 0;
      const y = item.transform?.[5] ?? 0;
      if (y < 65 || y > 780 || value === book.heading) continue;
      const chapterMatch = value.match(chapterPattern);
      if (chapterMatch) {
        finishVerse();
        chapter = Number(chapterMatch[1]);
        continue;
      }
      const isVerseNumber = chapter && /^\d{1,3}$/.test(value) && x >= 75 && x <= 115;
      if (isVerseNumber) {
        finishVerse();
        current = { chapter, verse: Number(value), parts: [] };
        continue;
      }
      if (current) current.parts.push(value);
    }
  }
  finishVerse();
  return verses;
}

async function main() {
  const pdfjsPath = await findPdfJs();
  const pdfjs = await import(pathToFileURL(pdfjsPath).href);
  const document = await pdfjs.getDocument({ url: pathToFileURL(source).href }).promise;
  await mkdir(output, { recursive: true });
  const manifest = { source: "Portugues-Catolica-AVM-All-Bible.pdf", translation: "Ave-Maria", books: {}, totalVerses: 0 };

  for (const book of books) {
    const verses = await extractBook(document, book);
    const foundChapters = new Set(verses.map((verse) => verse.chapter));
    if (foundChapters.size !== book.chapters) {
      throw new Error(`${book.name}: esperados ${book.chapters} capítulos, encontrados ${foundChapters.size}.`);
    }
    manifest.books[book.name] = { chapters: foundChapters.size, verses: verses.length, pages: book.pages };
    manifest.totalVerses += verses.length;
    await writeFile(join(output, `${book.slug}.json`), `${JSON.stringify(verses, null, 2)}\n`);
  }
  await writeFile(join(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest));
}

await main();
