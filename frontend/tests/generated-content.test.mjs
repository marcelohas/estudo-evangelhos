import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const generated = new URL("../../content/generated/", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, generated), "utf8"));
}

test("o conteúdo gerado possui referências únicas e comentários pesquisáveis", async () => {
  const manifest = await readJson("manifest.json");
  const index = await readJson("search-index.json");
  const records = (await Promise.all([
    readJson("catena/en/marcos.json"),
    readJson("catena/en/lucas.json"),
    readJson("catena/en/joao.json"),
  ])).flat();

  assert.equal(records.length, manifest.totalPassages);
  assert.equal(index.length, manifest.totalPassages);
  assert.equal(new Set(records.map((record) => record.id)).size, records.length);
  assert.ok(records.every((record) => record.reference && record.comments.length));
  assert.ok(records.every((record) => record.comments.every((comment) => comment.author && comment.text)));
});

test("a tradução em revisão possui índice próprio e referências únicas por Evangelho", async () => {
  const audit = await readJson("translation-audit.json");
  const index = await readJson("search-index-pt-BR.json");
  const browserCatalog = await readJson("catalog-pt-BR.json");
  const recordsByBook = await Promise.all([
    readJson("catena/pt-BR/marcos.json"),
    readJson("catena/pt-BR/lucas.json"),
    readJson("catena/pt-BR/joao.json"),
  ]);
  const records = recordsByBook.flat();

  assert.equal(records.length, audit.totalPassages);
  assert.equal(index.length, audit.totalPassages);
  assert.equal(browserCatalog.length, audit.totalPassages);
  assert.ok(browserCatalog.every((record) => record.bibleText && record.gospelText && record.comments.length));
  assert.ok(records.every((record) => record.language === "pt-BR" && record.reviewStatus === "em_revisao"));
  assert.ok(records.every((record) => record.contentMarkdown && record.plainText));
  for (const bookRecords of recordsByBook) {
    assert.equal(new Set(bookRecords.map((record) => record.id)).size, bookRecords.length);
  }
});

test("a Bíblia Ave-Maria contém os quatro Evangelhos completos e versículos únicos", async () => {
  const manifest = await readJson("bible/pt-BR/manifest.json");
  const books = await Promise.all([
    readJson("bible/pt-BR/mateus.json"),
    readJson("bible/pt-BR/marcos.json"),
    readJson("bible/pt-BR/lucas.json"),
    readJson("bible/pt-BR/joao.json"),
  ]);
  const verses = books.flat();

  assert.equal(manifest.totalVerses, 3779);
  assert.equal(verses.length, manifest.totalVerses);
  assert.equal(new Set(verses.map((verse) => verse.id)).size, verses.length);
  assert.ok(verses.every((verse) => verse.text && !verse.text.includes("�")));
});
