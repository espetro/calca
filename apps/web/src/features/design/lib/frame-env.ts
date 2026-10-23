import { createDefaultFormatRegistry } from "@calca/format-html-tailwind";
import type { FrameEnv, FormatRegistry } from "@calca/format/browser";
import { resolveFormatEnv } from "@calca/format/browser";

/** Output format the app renders frames with. */
export const DEFAULT_OUTPUT_FORMAT = "html-tailwind";

let registry: FormatRegistry | undefined;

/** Registry pre-registered with the built-in formats (created once). */
export const getFormatRegistry = (): FormatRegistry => {
  registry ??= createDefaultFormatRegistry();
  return registry;
};

/**
 * Resolve the frame environment for the active output format. Returns
 * `undefined` when the format is unknown so callers can fall back to the
 * legacy hardcoded frame template.
 */
export const getFrameEnv = (formatId: string = DEFAULT_OUTPUT_FORMAT): FrameEnv | undefined => {
  const reg = getFormatRegistry();
  if (!reg.has(formatId)) return undefined;
  return resolveFormatEnv(reg, formatId);
};
