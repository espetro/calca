/**
 * Copies the Tailwind v4 browser runtime from the package's devDependency into
 * `dist/assets/tailwindcss.js` so the package ships the runtime file. The web
 * app and desktop shell copy it from here at their own build time.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const src = resolve(
  import.meta.dirname,
  "..",
  "node_modules",
  "@tailwindcss",
  "browser",
  "dist",
  "index.global.js",
);
const outDir = resolve(import.meta.dirname, "..", "dist", "assets");
await mkdir(outDir, { recursive: true });
await copyFile(src, resolve(outDir, "tailwindcss.js"));
console.log(`format-html-tailwind: copied tailwind runtime → dist/assets/tailwindcss.js`);
