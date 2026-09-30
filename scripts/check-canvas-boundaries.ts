/**
 * Drift check: `@xyflow/*` (React Flow) imports may only exist inside
 * `packages/canvas-flow`. Run with `bun scripts/check-canvas-boundaries.ts`.
 */

const ALLOWED_PREFIX = "packages/canvas-flow/";
const SCAN_ROOTS = ["apps", "packages", "platforms"];
const PATTERN = /@xyflow\//;

const offenders: string[] = [];

for (const root of SCAN_ROOTS) {
  const glob = new Bun.Glob(`${root}/**/*.{ts,tsx}`);
  for await (const file of glob.scan({ cwd: `${import.meta.dir}/..` })) {
    if (file.startsWith(ALLOWED_PREFIX)) continue;
    const text = await Bun.file(`${import.meta.dir}/../${file}`).text();
    if (PATTERN.test(text)) {
      offenders.push(file);
    }
  }
}

if (offenders.length > 0) {
  console.error(`@xyflow imports found outside ${ALLOWED_PREFIX}:`);
  for (const file of offenders) {
    console.error(`  ${file}`);
  }
  process.exit(1);
}

console.log(`canvas boundary check: OK — @xyflow only under ${ALLOWED_PREFIX}`);
