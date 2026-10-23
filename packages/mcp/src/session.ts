import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { CanvasSnapshot } from "@calca/canvas-base";
import { resolveFormats, HTML_TAILWIND_FORMAT_ID, type FormatDef } from "@calca/format";
import { createCanvasSession, type CanvasSession, type SessionFormat } from "@calca/mcp-core";
import { consola } from "consola";

/**
 * Built-in `html-tailwind` definition seeded into every session so project
 * manifests can `extends` it without bundling the Tailwind runtime. The
 * logical `calca:tailwind` script token is resolved to a real URL by the
 * host at render time (see `@calca/format-html-tailwind`).
 */
const BUILTIN_FORMATS = [
  {
    def: {
      exporters: ["standalone-html"],
      frameEnv: {
        animations: "none" as const,
        attrs: {},
        bodyBackground: "white",
        customCssPassthrough: true,
        scripts: ["calca:tailwind"],
      },
      id: HTML_TAILWIND_FORMAT_ID,
    },
    sourcePath: "builtin:html-tailwind",
  },
];

/**
 * Resolve manifest-relative asset paths (`./`, `../`) against the manifest's
 * own directory so consumers receive directly loadable URLs. Logical tokens
 * (`calca:*`), bare ids and absolute paths pass through untouched. Built-in
 * definitions carry a `builtin:` source path and are left alone.
 */
function absolutizeAssets(sourcePath: string, def: FormatDef): FormatDef {
  if (sourcePath.startsWith("builtin:")) return def;
  const dir = dirname(sourcePath);
  const fix = (p: string): string => (p.startsWith("./") || p.startsWith("../") ? join(dir, p) : p);
  const frameEnv = def.frameEnv;
  return {
    ...def,
    frameEnv: {
      ...frameEnv,
      ...(frameEnv.scripts ? { scripts: frameEnv.scripts.map(fix) } : {}),
      ...(frameEnv.styles ? { styles: frameEnv.styles.map(fix) } : {}),
    },
  };
}

export interface LoadSessionOptions {
  file?: string;
  agentId: string;
  /** Explicit formats directory (overrides discovery). */
  formatsDir?: string;
}

/**
 * Discover output formats for the session. An explicit `formatsDir` is
 * used verbatim as the single source; otherwise discovery walks up from
 * `process.cwd()`. Warnings are logged, never fatal.
 */
export function loadFormats(formatsDir?: string): { formats: SessionFormat[]; warnings: string[] } {
  const baseDefs = BUILTIN_FORMATS.map((f) => f.def);
  const result = formatsDir
    ? resolveFormats({ baseDefs, env: { CALCA_FORMATS: formatsDir } })
    : resolveFormats({ baseDefs, startDir: process.cwd() });
  for (const warning of result.warnings) consola.warn(warning);
  const formats = [...BUILTIN_FORMATS, ...result.sources].map(({ def, sourcePath }) => ({
    def: absolutizeAssets(sourcePath, def),
    sourcePath,
  }));
  return { formats, warnings: result.warnings };
}

export async function loadSession(options: LoadSessionOptions): Promise<CanvasSession> {
  let snapshot: CanvasSnapshot | undefined;
  if (options.file) {
    try {
      snapshot = JSON.parse(await readFile(options.file, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        consola.warn(`board file not found, starting empty: ${options.file}`);
      } else {
        throw error;
      }
    }
  }

  const { formats, warnings: formatWarnings } = loadFormats(options.formatsDir);
  if (formats.length > 0) {
    consola.info(
      `loaded ${formats.length} output format(s): ${formats.map((f) => f.def.id).join(", ")}`,
    );
  }

  const session = createCanvasSession({
    snapshot,
    agentId: options.agentId,
    formats,
    formatWarnings,
  });

  if (options.file) {
    const file = options.file;
    let pending: ReturnType<typeof setTimeout> | undefined;
    session.store.addEventListener("change", () => {
      clearTimeout(pending);
      pending = setTimeout(() => {
        writeFile(file, JSON.stringify(session.store.snapshot(), null, 2)).catch((error) =>
          consola.warn(`autosave failed: ${error}`),
        );
      }, 250);
    });
  }

  return session;
}
