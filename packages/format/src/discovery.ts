import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

import type { FormatDef, FormatRegistry } from "./format";
import { createFormatRegistry, resolveFormatEnv } from "./format";
import { parseManifest } from "./manifest";

/** A format definition plus the manifest file it was parsed from. */
export interface DiscoveredFormat {
  def: FormatDef;
  sourcePath: string;
}

export interface DiscoverFormatDirsOptions {
  /** Directory to walk upward from. Defaults to `process.cwd()`. */
  startDir?: string;
  /** Home directory whose `.calca/formats` is the fallback. Defaults to `os.homedir()`. */
  home?: string;
  /** Environment variables consulted for `CALCA_FORMATS`. Defaults to `process.env`. */
  env?: Record<string, string | undefined>;
  /**
   * Built-in definitions registered at lowest precedence so discovered
   * manifests can `extends` them. Never listed as sources.
   */
  baseDefs?: FormatDef[];
}

export interface ResolveFormatsResult {
  registry: FormatRegistry;
  /** Non-fatal problems (unreadable dirs, malformed manifests). */
  warnings: string[];
  /** Loaded definitions, nearest-first (deepest definition wins per id). */
  sources: DiscoveredFormat[];
}

/**
 * Walk `startDir` upward collecting existing `<dir>/.calca/formats` dirs,
 * nearest-first, then append `<home>/.calca/formats` when it exists. The
 * walk ignores repository boundaries and stops at the filesystem root and
 * the home directory (both terminators). Paths are realpath-normalized and
 * deduplicated. When `env.CALCA_FORMATS` is set and non-empty it is
 * returned verbatim as the single source — the caller validates existence.
 */
/**
 * `realpathSync` that tolerates a missing path — returns the resolved
 * absolute path as-is. Discovery must never throw because a home or start
 * directory does not exist.
 */
const safeRealpath = (path: string): string => {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
};

export const discoverFormatDirs = (options: DiscoverFormatDirsOptions = {}): string[] => {
  const env = options.env ?? process.env;
  const override = env.CALCA_FORMATS?.trim();
  if (override) return [override];

  const home = safeRealpath(options.home ?? homedir());
  let current = safeRealpath(resolve(options.startDir ?? process.cwd()));

  const found: string[] = [];
  const seen = new Set<string>();
  const push = (dir: string): void => {
    const formatsDir = join(dir, ".calca", "formats");
    if (existsSync(formatsDir) && !seen.has(formatsDir)) {
      seen.add(formatsDir);
      found.push(formatsDir);
    }
  };

  while (true) {
    push(current);
    if (current === home || current === "/" || current === home + "/") break;
    const parent = resolve(current, "..");
    if (parent === current) break; // filesystem root safety
    current = parent;
  }
  if (home !== "/") push(home);
  return found;
};

/**
 * Parse every `*.json` manifest in `dir` into a `FormatDef`. Malformed or
 * unreadable files are skipped with a warning instead of failing the load.
 */
export const loadFormatsFromDir = (
  dir: string,
): { formats: DiscoveredFormat[]; warnings: string[] } => {
  const formats: DiscoveredFormat[] = [];
  const warnings: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    warnings.push(`formats: cannot read ${dir}: ${(error as Error).message}`);
    return { formats, warnings };
  }
  for (const entry of entries.sort()) {
    if (!entry.endsWith(".json")) continue;
    const sourcePath = join(dir, entry);
    try {
      const json: unknown = JSON.parse(readFileSync(sourcePath, "utf8"));
      formats.push({ def: parseManifest(json), sourcePath });
    } catch (error) {
      warnings.push(`formats: skipping ${sourcePath}: ${(error as Error).message}`);
    }
  }
  return { formats, warnings };
};

/**
 * Discover format directories, load their manifests, and build a
 * `FormatRegistry` in which the deepest (nearest) definition wins per id.
 * A discovered definition that `extends` an id present in the loaded chain
 * has its `frameEnv` pre-resolved against the registry (defaults applied,
 * parent envs merged parent-first).
 */
export const resolveFormats = (options: DiscoverFormatDirsOptions = {}): ResolveFormatsResult => {
  const dirs = discoverFormatDirs(options);
  const warnings: string[] = [];
  const sources: DiscoveredFormat[] = [];

  for (const dir of dirs) {
    const { formats, warnings: dirWarnings } = loadFormatsFromDir(dir);
    warnings.push(...dirWarnings);
    sources.push(...formats);
  }

  // Register shallowest-first so the nearest definition overwrites.
  const registry = createFormatRegistry(options.baseDefs ?? []);
  for (const { def } of [...sources].reverse()) registry.register(def);

  // Pre-resolve `extends` chains that are fully present in the registry.
  for (const { def } of sources) {
    if (!def.extends) continue;
    if (!registry.has(def.extends)) {
      warnings.push(`formats: "${def.id}" extends unknown format "${def.extends}"`);
      continue;
    }
    try {
      registry.register({ ...def, frameEnv: resolveFormatEnv(registry, def.id) });
    } catch (error) {
      warnings.push(`formats: cannot resolve "${def.id}": ${(error as Error).message}`);
    }
  }

  return { registry, warnings, sources };
};
