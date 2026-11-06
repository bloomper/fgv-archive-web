// Copies pdf.js's worker, standard fonts, CMaps and decoders from node_modules into public/pdfjs, so the reader loads
// them from the web's own origin (the CSP allows nothing else). Run before dev and build; public/pdfjs is not in git.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = dirname(require.resolve("pdfjs-dist/package.json"));
const target = join(process.cwd(), "public", "pdfjs");

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(join(root, "build", "pdf.worker.min.mjs"), join(target, "pdf.worker.min.mjs"));
for (const folder of ["standard_fonts", "cmaps", "wasm", "iccs"]) {
  cpSync(join(root, folder), join(target, folder), { recursive: true });
}
console.log(`pdf.js assets copied to ${target}`);
