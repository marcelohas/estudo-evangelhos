import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const frontend = dirname(dirname(fileURLToPath(import.meta.url)));
const root = dirname(frontend);
const dist = join(frontend, "dist");
const destination = join(root, "docs");
const html = await readFile(join(dist, "index.html"), "utf8");
const assets = [
  ...html.matchAll(/(?:src|href)="\.\/(assets\/[^"?]+)"/g),
].map((match) => match[1]);

if (!assets.some((path) => path.endsWith(".js")) || !assets.some((path) => path.endsWith(".css"))) {
  throw new Error("O index compilado não contém os assets esperados.");
}

await rm(destination, { recursive: true, force: true });
await mkdir(join(destination, "assets"), { recursive: true });
await Promise.all(assets.map(async (asset) => {
  await copyFile(join(dist, asset), join(destination, asset));
}));
await Promise.all([
  copyFile(join(dist, "index.html"), join(destination, "index.html")),
  copyFile(join(dist, "favicon.svg"), join(destination, "favicon.svg")),
  writeFile(join(destination, ".nojekyll"), ""),
]);

console.log(`GitHub Pages preparado em ${destination}`);
