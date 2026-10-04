/**
 * Bundle budgets for the publishable canvas packages (issue #39).
 * Gzipped size of each package's ESM entry must stay under budget so the
 * library stays lean. Run with `bun scripts/check-bundle-budgets.ts`
 * (requires `turbo build` first).
 */

import { gzipSync } from "node:zlib";

const BUDGETS: Record<string, { file: string; kib: number }> = {
  "@calca/canvas-base": { file: "packages/canvas-base/dist/index.mjs", kib: 10 },
  "@calca/canvas-flow": { file: "packages/canvas-flow/dist/index.mjs", kib: 25 },
};

const failures: string[] = [];

for (const [pkg, { file, kib }] of Object.entries(BUDGETS)) {
  const path = `${import.meta.dir}/../${file}`;
  if (!(await Bun.file(path).exists())) {
    failures.push(`${pkg}: ${file} missing — run bun run build first`);
    continue;
  }
  const bytes = gzipSync(await Bun.file(path).arrayBuffer()).length;
  const actual = bytes / 1024;
  const status = actual <= kib ? "OK" : "OVER";
  console.log(`${pkg}: ${actual.toFixed(1)} KiB gz / ${kib} KiB budget — ${status}`);
  if (actual > kib) failures.push(`${pkg} over budget`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
