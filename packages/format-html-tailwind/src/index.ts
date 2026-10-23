/**
 * The `html-tailwind` output format: Tailwind-styled HTML frames rendered in a
 * sandboxed iframe with the Tailwind v4 browser runtime.
 *
 * The runtime is NOT bundled here — `frameEnv.scripts` carries the logical
 * token `calca:tailwind`, which the host app resolves to a real URL at render
 * time (see `TAILWIND_SCRIPT_TOKEN`). The v4 runtime file itself is shipped as
 * a package asset (`dist/assets/tailwindcss.js`) via `bun run assets`.
 */
import type { FormatDef, FormatRegistry } from "@calca/format/browser";
import { createFormatRegistry } from "@calca/format/browser";

/** Logical script token in `frameEnv.scripts` — resolved to a URL by the host. */
export const TAILWIND_SCRIPT_TOKEN = "calca:tailwind";

/** The Tailwind HTML output format definition. */
export const htmlTailwindFormat: FormatDef = {
  exporters: ["standalone-html"],
  frameEnv: {
    animations: "none",
    bodyBackground: "white",
    customCssPassthrough: true,
    scripts: [TAILWIND_SCRIPT_TOKEN],
  },
  id: "html-tailwind",
};

/**
 * A registry pre-registered with the built-in formats. Apps can add their own
 * definitions on top without re-registering the defaults.
 */
export const createDefaultFormatRegistry = (): FormatRegistry =>
  createFormatRegistry([htmlTailwindFormat]);
