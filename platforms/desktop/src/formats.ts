import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { HTML_TAILWIND_FORMAT_ID, resolveFormats, type FormatDef } from "@calca/format";
import { getLogger } from "@logtape/logtape";

const log = getLogger(["calca", "desktop", "formats"]);

/**
 * Manifest-relative assets are resolved to absolute files at discovery time
 * and registered here; the web app only ever sees opaque `/formats-assets/<id>`
 * URLs, so no filesystem path leaks into the browser and path traversal is
 * impossible.
 */
const assetRegistry = new Map<string, string>();

const registerAsset = (manifestPath: string, relative: string): string => {
  const absolute = resolve(dirname(manifestPath), relative);
  if (!existsSync(absolute)) {
    log.warn`Format asset not found: ${relative} (${manifestPath})`;
    return relative;
  }
  const id = createHash("sha256").update(absolute).digest("hex").slice(0, 16);
  assetRegistry.set(id, absolute);
  return `/formats-assets/${id}`;
};

/**
 * Built-in `html-tailwind` definition seeded at lowest precedence so project
 * manifests can `extends` it. Matches the builtin seeded by `@calca/mcp`
 * (logical `calca:tailwind` script token, resolved to a URL by the renderer).
 */
const BUILTIN_HTML_TAILWIND: FormatDef = {
  exporters: ["standalone-html"],
  frameEnv: {
    animations: "none",
    attrs: {},
    bodyBackground: "white",
    customCssPassthrough: true,
    scripts: ["calca:tailwind"],
  },
  id: HTML_TAILWIND_FORMAT_ID,
};

/**
 * Manifest-relative asset paths (`./`, `../`) are resolved against the
 * manifest's directory and rewritten to `/formats-assets/<id>` URLs served by
 * the desktop shell (see `serveFormatAsset` in server.ts). Logical tokens
 * (`calca:*`), bare ids and absolute URLs pass through untouched.
 */
const absolutizeAssets = (sourcePath: string, def: FormatDef): FormatDef => {
  if (sourcePath.startsWith("builtin:")) return def;
  const fix = (p: string): string => {
    if (!p.startsWith("./") && !p.startsWith("../")) return p;
    return registerAsset(sourcePath, p);
  };
  const frameEnv = def.frameEnv;
  return {
    ...def,
    frameEnv: {
      ...frameEnv,
      ...(frameEnv.scripts ? { scripts: frameEnv.scripts.map(fix) } : {}),
      ...(frameEnv.styles ? { styles: frameEnv.styles.map(fix) } : {}),
    },
  };
};

export interface DesktopFormatsPayload {
  /** Format definitions, nearest-first resolution already applied. */
  formats: FormatDef[];
  /** Non-fatal discovery problems (surfaced to the web app console). */
  warnings: string[];
  /** Absolute project directory discovery walked up from. */
  projectDir: string;
}

let cached: DesktopFormatsPayload | undefined;

/**
 * Resolve output formats for the current project directory: `.calca/formats`
 * dirs are discovered walking up from `projectDir` (env `CALCA_FORMATS`
 * override honored), with `~/.calca/formats` as fallback. Cached after the
 * first resolve — the project directory is fixed for the session.
 */
export const getDesktopFormats = (projectDir: string): DesktopFormatsPayload => {
  cached ??= (() => {
    try {
      const result = resolveFormats({
        baseDefs: [BUILTIN_HTML_TAILWIND],
        startDir: projectDir,
      });
      for (const warning of result.warnings) log.warn(warning);
      return {
        formats: result.sources.map(({ def, sourcePath }) => absolutizeAssets(sourcePath, def)),
        projectDir,
        warnings: result.warnings,
      };
    } catch (error) {
      log.error`Format discovery failed: ${(error as Error).message}`;
      const message = error instanceof Error ? error.message : String(error);
      return { formats: [], projectDir, warnings: [message] };
    }
  })();
  return cached;
};

/** Absolute path for a registered `/formats-assets/<id>` asset, if any. */
export const getFormatAssetPath = (id: string): string | undefined => assetRegistry.get(id);

/** Reset the cached payload and asset registry (tests / project-dir switches). */
export const resetDesktopFormats = (): void => {
  cached = undefined;
  assetRegistry.clear();
};
