import { readFile, writeFile } from "node:fs/promises";

import type { CanvasSnapshot } from "@calca/canvas-base";
import { resolveFormats } from "@calca/format";
import { createCanvasSession, type CanvasSession, type SessionFormat } from "@calca/mcp-core";
import { consola } from "consola";

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
export function loadFormats(formatsDir?: string): SessionFormat[] {
  const result = formatsDir
    ? resolveFormats({ env: { CALCA_FORMATS: formatsDir } })
    : resolveFormats({ startDir: process.cwd() });
  for (const warning of result.warnings) consola.warn(warning);
  return result.sources;
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

  const formats = loadFormats(options.formatsDir);
  if (formats.length > 0) {
    consola.info(
      `loaded ${formats.length} output format(s): ${formats.map((f) => f.def.id).join(", ")}`,
    );
  }

  const session = createCanvasSession({ snapshot, agentId: options.agentId, formats });

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
