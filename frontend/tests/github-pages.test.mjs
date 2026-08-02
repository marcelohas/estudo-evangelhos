import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("o index do GitHub Pages é autocontido e funciona sem servidor", async () => {
  const docs = new URL("../../docs/", import.meta.url);
  const html = await readFile(new URL("index.html", docs), "utf8");

  assert.match(html, /<style>[\s\S]+<\/style>/);
  assert.match(html, /<script>[\s\S]+<\/script>/);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="\.\/assets\//);
  await access(new URL("favicon.svg", docs));
  assert.doesNotMatch(html, /\/api\//);
});
