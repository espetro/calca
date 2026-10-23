import type { FormatDef } from "@calca/format/browser";

import { registerFormats } from "#/features/design/lib/frame-env";

/**
 * Payload served by the desktop shell at `/api/formats`: output formats
 * discovered for the current project directory (`.calca/formats` walk-up +
 * `~/.calca/formats` fallback), with manifest-relative assets already
 * rewritten to `/formats-assets/…` URLs.
 */
export interface DesktopFormatsPayload {
  formats: FormatDef[];
  warnings: string[];
  projectDir: string;
}

/**
 * When running inside the desktop shell, fetch the project's resolved
 * output formats and register them into the shared format registry so
 * frame rendering picks them up. Best-effort: any failure (web app outside
 * desktop, server unreachable, malformed payload) is logged and ignored —
 * the built-in registry keeps working.
 */
export const hydrateDesktopFormats = async (): Promise<void> => {
  if (!window.__electrobun) return;
  try {
    const response = await fetch("/api/formats");
    if (!response.ok) {
      console.warn(`[formats] desktop formats endpoint returned ${response.status}`);
      return;
    }
    const payload = (await response.json()) as DesktopFormatsPayload;
    if (payload.warnings.length > 0) {
      console.warn("[formats] project format discovery warnings:", payload.warnings);
    }
    registerFormats(payload.formats);
    console.info(
      `[formats] registered ${payload.formats.length} project format(s) from ${payload.projectDir}`,
    );
  } catch (error) {
    console.warn("[formats] failed to load desktop formats:", error);
  }
};
