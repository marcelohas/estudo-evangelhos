import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

test("o index do GitHub Pages é autocontido e funciona sem servidor", async () => {
  const docs = new URL("../../docs/", import.meta.url);
  const html = await readFile(new URL("index.html", docs), "utf8");

  assert.match(html, /<script type="module"[^>]+src="\.\/assets\//);
  assert.match(html, /<link rel="stylesheet"[^>]+href="\.\/assets\//);
  assert.ok((await stat(new URL("index.html", docs))).size < 20_000);
  const assetReferences = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)];
  assert.ok(assetReferences.length >= 2);
  await Promise.all(assetReferences.map((match) => access(new URL(match[1], docs))));
  await access(new URL("favicon.svg", docs));
  assert.doesNotMatch(html, /\/api\//);
});
