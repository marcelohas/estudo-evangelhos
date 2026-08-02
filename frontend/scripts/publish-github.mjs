import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const frontend = dirname(dirname(fileURLToPath(import.meta.url)));
const root = dirname(frontend);
const dist = join(frontend, "dist");
const destination = join(root, "docs");
const html = await readFile(join(dist, "abrir-site.html"), "utf8");
if (!html.includes("<style>") || !html.includes("<script>")) {
  throw new Error("A versão autocontida não possui CSS e JavaScript incorporados.");
}

await Promise.all([
  rm(join(destination, "assets"), { recursive: true, force: true }),
  rm(join(destination, "index.html"), { force: true }),
  rm(join(destination, "favicon.svg"), { force: true }),
  rm(join(destination, ".nojekyll"), { force: true }),
]);
await mkdir(destination, { recursive: true });
await Promise.all([
  writeFile(join(destination, "index.html"), html, "utf8"),
  copyFile(join(dist, "favicon.svg"), join(destination, "favicon.svg")),
  writeFile(join(destination, ".nojekyll"), ""),
]);

console.log(`GitHub Pages preparado em ${destination}`);
