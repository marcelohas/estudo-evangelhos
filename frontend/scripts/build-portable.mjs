import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const output = new URL("../dist/", import.meta.url);
const htmlPath = new URL("index.html", output);
let html = await readFile(htmlPath, "utf8");

const cssPath = html.match(/href="\.\/(assets\/[^\"]+\.css)"/)?.[1];
const jsPath = html.match(/src="\.\/(assets\/[^\"]+\.js)"/)?.[1];

if (!cssPath || !jsPath) {
  throw new Error("Não foi possível localizar os arquivos compilados.");
}

const [css, javascript] = await Promise.all([
  readFile(join(fileURLToPath(output), cssPath), "utf8"),
  readFile(join(fileURLToPath(output), jsPath), "utf8"),
]);

html = html
  .replace(/<link rel="stylesheet"[^>]+>/, () => `<style>${css}</style>`)
  .replace(/<script type="module"[^>]+><\/script>/, "")
  .replace(/<\/body>/, () => `<script>${javascript}</script>\n  </body>`);

await writeFile(new URL("abrir-site.html", output), html, "utf8");
