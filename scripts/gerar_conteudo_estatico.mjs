import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, "fonte-xml", "catena.xml");
const outputDir = join(root, "content", "generated");

const books = {
  Mark: { slug: "marcos", name: "Marcos", abbr: "mc" },
  Luke: { slug: "lucas", name: "Lucas", abbr: "lc" },
  John: { slug: "joao", name: "João", abbr: "jo" },
};

function decodeXml(value) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return entities[entity.toLowerCase()] ?? _;
  });
}

function repairSourceEncoding(value) {
  const replacements = new Map([
    ["â€™", "’"], ["â€˜", "‘"], ["â€œ", "“"], ["â€", "”"],
    ["â€“", "–"], ["â€”", "—"], ["Ã†", "Æ"], ["Ã¦", "æ"],
  ]);
  return [...replacements].reduce((text, [broken, repaired]) => text.replaceAll(broken, repaired), value);
}

function cleanText(value) {
  return repairSourceEncoding(decodeXml(value.replace(/<[^>]+>/g, " "))).replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function parseReference(rawReference) {
  const matches = [...rawReference.matchAll(/(Mark|Luke|John)\.(\d+)\.(\d+)/g)];
  if (!matches.length) return undefined;
  const [book, chapter, firstVerse] = matches[0].slice(1);
  const [lastBook, lastChapter, lastVerse] = matches.at(-1).slice(1);
  if (lastBook !== book || lastChapter !== chapter) {
    throw new Error(`Intervalo entre capítulos ainda não suportado: ${rawReference}`);
  }
  return { book, chapter: Number(chapter), firstVerse: Number(firstVerse), lastVerse: Number(lastVerse) };
}

function makeReference(book, chapter, firstVerse, lastVerse) {
  const verses = firstVerse === lastVerse ? firstVerse : `${firstVerse}-${lastVerse}`;
  return `${books[book].name} ${chapter},${verses}`;
}

function extractContent(sectionXml) {
  let gospelText = "";
  const comments = [];
  const paragraphs = [...sectionXml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];

  for (const paragraphMatch of paragraphs) {
    const paragraph = paragraphMatch[1];
    const italic = paragraph.match(/<hi\b[^>]*type=["']italic["'][^>]*>([\s\S]*?)<\/hi>/i);
    if (italic) {
      gospelText = cleanText(italic[1]);
      continue;
    }
    const bold = paragraph.match(/<hi\b[^>]*type=["']bold["'][^>]*>([\s\S]*?)<\/hi>/i);
    if (bold) {
      const author = cleanText(bold[1]).replace(/:$/, "");
      const text = cleanText(paragraph.replace(bold[0], ""));
      comments.push({ author, text });
    } else {
      const text = cleanText(paragraph);
      if (!text) continue;
      if (comments.length) comments.at(-1).text = `${comments.at(-1).text} ${text}`.trim();
      else comments.push({ author: "Glosa", text });
    }
  }
  return { gospelText, comments };
}

async function main() {
  const xml = await readFile(sourcePath, "utf8");
  const byBook = Object.fromEntries(Object.keys(books).map((book) => [book, []]));
  const searchIndex = [];
  const sections = xml.matchAll(/<div\b([^>]*\bannotateRef=["'][^"']+["'][^>]*)>([\s\S]*?)<\/div>/gi);

  for (const [, attributes, sectionXml] of sections) {
    const rawReference = attributes.match(/\bannotateRef=["']([^"']+)["']/i)?.[1] ?? "";
    const parsed = parseReference(rawReference);
    if (!parsed) continue;
    const { book, chapter, firstVerse, lastVerse } = parsed;
    const { gospelText, comments } = extractContent(sectionXml);
    if (!comments.length) continue;
    const metadata = books[book];
    const id = `${metadata.abbr}-${chapter}-${firstVerse}-${lastVerse}`;
    const reference = makeReference(book, chapter, firstVerse, lastVerse);
    byBook[book].push({
      id, book: metadata.name, chapter, verseStart: firstVerse, verseEnd: lastVerse,
      reference, gospelText, comments, language: "en", source: "Catena Aurea OSIS",
    });
    searchIndex.push({
      id, book: metadata.name, chapter, verseStart: firstVerse, verseEnd: lastVerse,
      reference, normalizedReference: normalize(reference),
      authors: [...new Set(comments.map((comment) => comment.author))].sort(),
    });
  }

  await mkdir(join(outputDir, "catena", "en"), { recursive: true });
  for (const [book, records] of Object.entries(byBook)) {
    records.sort((a, b) => a.chapter - b.chapter || a.verseStart - b.verseStart || a.verseEnd - b.verseEnd);
    await writeFile(join(outputDir, "catena", "en", `${books[book].slug}.json`), `${JSON.stringify(records, null, 2)}\n`);
  }
  searchIndex.sort((a, b) => a.book.localeCompare(b.book, "pt-BR") || a.chapter - b.chapter || a.verseStart - b.verseStart);
  await writeFile(join(outputDir, "search-index.json"), `${JSON.stringify(searchIndex, null, 2)}\n`);
  const manifest = {
    source: relative(root, sourcePath).replaceAll("\\", "/"), language: "en",
    books: Object.fromEntries(Object.entries(byBook).map(([book, records]) => [books[book].name, records.length])),
    totalPassages: Object.values(byBook).reduce((total, records) => total + records.length, 0),
  };
  await writeFile(join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest));
}

await main();
