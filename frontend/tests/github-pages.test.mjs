import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("o index do GitHub Pages referencia somente arquivos publicados", async () => {
  const docs = new URL("../../docs/", import.meta.url);
  const html = await readFile(new URL("index.html", docs), "utf8");
  const references = [...html.matchAll(/(?:src|href)="\.\/(assets\/[^"?]+|favicon\.svg)"/g)]
    .map((match) => match[1]);

  assert.ok(references.some((path) => path.endsWith(".js")));
  assert.ok(references.some((path) => path.endsWith(".css")));
  await Promise.all(references.map((path) => access(new URL(path, docs))));
  assert.doesNotMatch(html, /\/api\//);
});
