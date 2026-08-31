import { copyFileSync, existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("pdfjs-dist/package.json"));
const candidates = [
  join(pkgDir, "build/pdf.worker.min.mjs"),
  join(pkgDir, "legacy/build/pdf.worker.min.mjs"),
];
const src = candidates.find((path) => existsSync(path));

if (!src) {
  throw new Error("Could not find pdf.worker.min.mjs inside pdfjs-dist");
}

mkdirSync("public", { recursive: true });
copyFileSync(src, join("public", "pdf.worker.min.mjs"));
console.log(`Copied PDF.js worker to public/pdf.worker.min.mjs`);
