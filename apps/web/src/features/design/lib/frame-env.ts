import { createDefaultFormatRegistry } from "@calca/format-html-tailwind";
import type { FrameEnv, FormatDef, FormatRegistry } from "@calca/format/browser";
import { resolveFormatEnv } from "@calca/format/browser";

import type { Settings } from "#/features/settings";

/** Output format the app renders frames with. */
export const DEFAULT_OUTPUT_FORMAT = "html-tailwind";

let registry: FormatRegistry | undefined;

/** Registry pre-registered with the built-in formats (created once). */
export const getFormatRegistry = (): FormatRegistry => {
  registry ??= createDefaultFormatRegistry();
  return registry;
};

/**
 * Register extra format definitions (e.g. discovered by the desktop shell
 * for the current project directory) into the shared registry. Later
 * registrations win, so project formats can override built-ins.
 */
export const registerFormats = (defs: FormatDef[]): void => {
  const reg = getFormatRegistry();
  for (const def of defs) reg.register(def);
};

const EMPTY_SETTINGS: FrameEnvSettings = {
  animationsAllowed: false,
};

/** The settings fields that influence frame-env resolution. */
export type FrameEnvSettings = Pick<Settings, "customCss" | "frameAttrs" | "animationsAllowed">;

/**
 * Apply user-configurable frame resources on top of a resolved env: attrs
 * are merged (settings win), animations flip to `"allow"` when enabled, and
 * custom CSS is appended to the inline CSS — but only when the format
 * allows `customCssPassthrough`.
 */
export const applySettingsToFrameEnv = (
  env: FrameEnv | undefined,
  settings: FrameEnvSettings,
): FrameEnv | undefined => {
  if (!env) return undefined;
  const merged: FrameEnv = { ...env };
  if (settings.frameAttrs && Object.keys(settings.frameAttrs).length > 0) {
    merged.attrs = { ...env.attrs, ...settings.frameAttrs };
  }
  if (settings.animationsAllowed) {
    merged.animations = "allow";
  }
  const customCss = settings.customCss?.trim();
  if (customCss && env.customCssPassthrough) {
    merged.inlineCss = env.inlineCss ? `${env.inlineCss}\n${customCss}` : customCss;
  }
  return merged;
};

/**
 * Resolve the frame environment for the active output format. Returns
 * `undefined` when the format is unknown so callers can fall back to the
 * legacy hardcoded frame template.
 */
export const getFrameEnv = (
  formatId: string = DEFAULT_OUTPUT_FORMAT,
  settings?: FrameEnvSettings,
): FrameEnv | undefined => {
  const reg = getFormatRegistry();
  if (!reg.has(formatId)) return undefined;
  return applySettingsToFrameEnv(resolveFormatEnv(reg, formatId), settings ?? EMPTY_SETTINGS);
};
