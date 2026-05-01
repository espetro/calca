import { mkdirSync } from "fs";

/**
 * Storage interfacing for the Calca desktop app.
 */
import { getLogger } from "@logtape/logtape";
import { Utils } from "electrobun";

const log = getLogger(["calca", "desktop", "storage"]);

export function setupStorageDir(): void {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  if (!home) return;

  const appSupport = Utils.paths.userData;

  try {
    // Ensure directory exists - Bun supports fs operations
    mkdirSync(appSupport, { recursive: true });

    // For now, we just ensure the path is noted
    log.info`App data directory: ${appSupport}`;
  } catch {
    // Ignore - storage setup is not critical for launch
  }
}
