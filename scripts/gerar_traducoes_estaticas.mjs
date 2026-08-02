import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(root, "content", "generated");
const books = [
  { slug: "marcos", name: "Marcos", abbr: "mc", directory: "marcos-em-revisao" },
  { slug: "lucas", name: "Lucas", abbr: "lc", directory: "lucas-em-revisao" },
  { slug: "joao", name: "João", abbr: "jo", directory: "joao-em-revisao" },
];

function cleanText(value) {
  return value.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
}

function plainText(markdown) {
  return markdown.replace(/^#{1,6}\s+/gm, "").replace(/[*_>`]/g, "")
    .replace(/\s+/g, " ").trim();
}

function splitTranslationContent(contentMarkdown) {
  const paragraphs = contentMarkdown.split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean);
  const comments = [];
  const gospelParagraphs = [];
  let commentaryStarted = false;

  for (const paragraph of paragraphs) {
    const authorMatch = paragraph.match(/^([^\d.][^.\n]{1,58})\.\s+([\s\S]+)$/u);
    const candidate = authorMatch?.[1]?.trim() ?? "";
    const looksLikeAuthor = authorMatch && !/^vers?$/i.test(candidate) && candidate.split(/\s+/).length <= 7;
    if (looksLikeAuthor) {
      commentaryStarted = true;
      comments.push({ author: candidate, text: authorMatch[2].trim() });
    } else if (commentaryStarted && comments.length) {
      comments.at(-1).text = `${comments.at(-1).text}\n\n${paragraph}`;
    } else {
      gospelParagraphs.push(paragraph);
    }
  }
  return { gospelText: plainText(gospelParagraphs.join("\n\n")), comments };
}

function parseSections(markdown, book, sourceFile) {
  const heading = /^###\s+(\d+)\s*:\s*(\d+)(?:\s*[-–—]\s*(\d+))?\s*$/gm;
  const matches = [...markdown.matchAll(heading)];
  return matches.map((match, index) => {
    const chapter = Number(match[1]);
    const verseStart = Number(match[2]);
    const verseEnd = Number(match[3] ?? match[2]);
    const contentMarkdown = cleanText(markdown.slice(
      match.index + match[0].length,
      matches[index + 1]?.index ?? markdown.length,
    ));
    const verses = verseStart === verseEnd ? verseStart : `${verseStart}-${verseEnd}`;
    const { gospelText, comments } = splitTranslationContent(contentMarkdown);
    return {
      id: `${book.abbr}-${chapter}-${verseStart}-${verseEnd}`,
      book: book.name,
      chapter,
      verseStart,
      verseEnd,
      reference: `${book.name} ${chapter},${verses}`,
      contentMarkdown,
      plainText: plainText(contentMarkdown),
      gospelText,
      comments,
      language: "pt-BR",
      reviewStatus: "em_revisao",
      sourceFile: relative(root, sourceFile).replaceAll("\\", "/"),
    };
  }).filter((record) => record.contentMarkdown);
}

async function main() {
  const destination = join(outputDir, "catena", "pt-BR");
  await mkdir(destination, { recursive: true });
  const audit = { language: "pt-BR", reviewStatus: "em_revisao", books: {}, totalPassages: 0 };
  const searchIndex = [];
  const browserCatalog = [];

  for (const book of books) {
    const sourceDirectory = join(root, "traducao-pt", book.directory);
    const filenames = (await readdir(sourceDirectory)).filter((name) => name.endsWith("-pt.md")).sort();
    const records = [];
    for (const filename of filenames) {
      const sourceFile = join(sourceDirectory, filename);
      records.push(...parseSections(await readFile(sourceFile, "utf8"), book, sourceFile));
    }
    const bibleVerses = JSON.parse(await readFile(join(outputDir, "bible", "pt-BR", `${book.slug}.json`), "utf8"));
    const bibleByChapter = new Map();
    for (const verse of bibleVerses) {
      const chapterVerses = bibleByChapter.get(verse.chapter) ?? new Map();
      chapterVerses.set(verse.verse, verse.text);
      bibleByChapter.set(verse.chapter, chapterVerses);
    }
    for (const record of records) {
      const chapterVerses = bibleByChapter.get(record.chapter) ?? new Map();
      record.bibleText = Array.from(
        { length: record.verseEnd - record.verseStart + 1 },
        (_, offset) => chapterVerses.get(record.verseStart + offset),
      ).filter(Boolean).join(" ");
    }
    records.sort((a, b) => a.chapter - b.chapter || a.verseStart - b.verseStart || a.verseEnd - b.verseEnd);

    const english = JSON.parse(await readFile(join(outputDir, "catena", "en", `${book.slug}.json`), "utf8"));
    const englishIds = new Set(english.map((record) => record.id));
    const portugueseIds = new Set(records.map((record) => record.id));
    const duplicateIds = records.map((record) => record.id).filter((id, index, all) => all.indexOf(id) !== index);
    const missingInPortuguese = [...englishIds].filter((id) => !portugueseIds.has(id));
    const extraInPortuguese = [...portugueseIds].filter((id) => !englishIds.has(id));

    audit.books[book.name] = {
      passages: records.length,
      exactMatches: records.filter((record) => englishIds.has(record.id)).length,
      missingInPortuguese,
      extraInPortuguese,
      duplicateIds: [...new Set(duplicateIds)],
      missingBibleText: records.filter((record) => !record.bibleText).map((record) => record.id),
    };
    audit.totalPassages += records.length;
    searchIndex.push(...records.map((record) => ({
      id: record.id,
      book: record.book,
      chapter: record.chapter,
      verseStart: record.verseStart,
      verseEnd: record.verseEnd,
      reference: record.reference,
      normalizedReference: record.reference.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
      excerpt: record.plainText.slice(0, 240),
      reviewStatus: record.reviewStatus,
    })));
    browserCatalog.push(...records.map((record) => ({
      id: record.id,
      book: record.book,
      chapter: record.chapter,
      verseStart: record.verseStart,
      verseEnd: record.verseEnd,
      reference: record.reference,
      gospelText: record.gospelText,
      bibleText: record.bibleText,
      comments: record.comments,
      reviewStatus: record.reviewStatus,
    })));
    await writeFile(join(destination, `${book.slug}.json`), `${JSON.stringify(records, null, 2)}\n`);
  }

  searchIndex.sort((a, b) => a.book.localeCompare(b.book, "pt-BR") || a.chapter - b.chapter || a.verseStart - b.verseStart);
  await writeFile(join(outputDir, "search-index-pt-BR.json"), `${JSON.stringify(searchIndex, null, 2)}\n`);
  await writeFile(join(outputDir, "catalog-pt-BR.json"), `${JSON.stringify(browserCatalog)}\n`);
  await writeFile(join(outputDir, "translation-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify(audit));
}

await main();
