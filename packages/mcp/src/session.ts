import { readFile, writeFile } from "node:fs/promises";

import type { CanvasSnapshot } from "@calca/canvas-base";
import { createCanvasSession, type CanvasSession } from "@calca/mcp-core";
import { consola } from "consola";

export interface LoadSessionOptions {
  file?: string;
  agentId: string;
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

  const session = createCanvasSession({ snapshot, agentId: options.agentId });

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
