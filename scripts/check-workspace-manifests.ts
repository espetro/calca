import { join } from "node:path";

/**
 * Dependency-drift gate: every workspace package must reference cataloged
 * dependencies via `catalog:` instead of pinning a literal version. The
 * governed set and its versions live in the root package.json `catalogs` field.
 *
 * Exits non-zero when a workspace manifest pins a cataloged dependency with a
 * literal version (e.g. `"zod": "^4.0.0"` instead of `"zod": "catalog:"`).
 */
import { Glob } from "bun";

const root = join(import.meta.dir, "..");

const DEP_SECTIONS = ["dependencies", "devDependencies", "peerDependencies"] as const;

interface Violation {
  manifest: string;
  section: string;
  dep: string;
  spec: string;
}

const loadJson = async (path: string) => JSON.parse(await Bun.file(path).text());

const main = async () => {
  const rootPkg = await loadJson(join(root, "package.json"));
  const catalogs: Record<string, Record<string, string>> = rootPkg.catalogs ?? {};
  const governed = new Set(Object.keys(catalogs.default ?? {}));

  if (governed.size === 0) {
    console.error("check-workspace-manifests: no `catalogs.default` found in root package.json");
    process.exit(1);
  }

  const manifests: string[] = [];
  for (const pattern of rootPkg.workspaces ?? []) {
    const glob = new Glob(`${pattern}/package.json`);
    for await (const match of glob.scan({ cwd: root, onlyFiles: true })) {
      manifests.push(match);
    }
  }

  const violations: Violation[] = [];
  for (const manifest of manifests) {
    const pkg = await loadJson(join(root, manifest));
    for (const section of DEP_SECTIONS) {
      for (const [dep, spec] of Object.entries(pkg[section] ?? {})) {
        if (governed.has(dep) && spec !== "catalog:") {
          violations.push({ manifest, section, dep, spec: String(spec) });
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error("Workspace manifests must use `catalog:` for cataloged dependencies:\n");
    for (const v of violations) {
      console.error(`  ${v.manifest}  ${v.section}.${v.dep}: "${v.spec}" → "catalog:"`);
    }
    console.error(
      `\n${violations.length} violation(s). Versions live in the root package.json "catalogs" field.`,
    );
    process.exit(1);
  }

  console.log(
    `check-workspace-manifests: ${manifests.length} manifests OK — ${[...governed].join(", ")} on catalog:`,
  );
};

await main();
