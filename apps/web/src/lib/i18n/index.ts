import * as m from "#/paraglide/messages.js";
import {
  isAvailableLanguageTag,
  languageTag,
  onSetLanguageTag,
  setLanguageTag,
  sourceLanguageTag,
} from "#/paraglide/runtime.js";
import type { AvailableLanguageTag } from "#/paraglide/runtime.js";

export { m };
export type { AvailableLanguageTag };

const LOCALE_STORAGE_KEY = "calca-locale";

// Locale convention: all language tags are lowercase — `pt-br`, `zh-hans`,
// never `pt-BR`. `project.inlang/settings.json` must follow the same rule when
// new locales are added.

const normalizeTag = (tag: string): string => tag.toLowerCase();

const matchSupported = (tag: string): AvailableLanguageTag | undefined => {
  const normalized = normalizeTag(tag);
  if (isAvailableLanguageTag(normalized)) return normalized;
  // Region fall-back: `pt-br` → `pt`.
  const base = normalized.split("-")[0];
  if (base && isAvailableLanguageTag(base)) return base;
  return undefined;
};

const resolveLocale = (): AvailableLanguageTag => {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const match = stored && matchSupported(stored);
    if (match) return match;
  } catch {
    // localStorage unavailable (private mode, SSR) — fall through.
  }
  for (const nav of navigator.languages ?? [navigator.language]) {
    const match = matchSupported(nav);
    if (match) return match;
  }
  return sourceLanguageTag;
};

export const getLocale = languageTag;

/**
 * Explicit user override — persists to localStorage and syncs `<html lang>`
 * (via the listener registered in `initLocale`).
 */
export const setLocale = (tag: AvailableLanguageTag): void => {
  setLanguageTag(normalizeTag(tag) as AvailableLanguageTag);
  localStorage.setItem(LOCALE_STORAGE_KEY, languageTag());
};

/**
 * Resolve the locale once at boot: stored override → navigator.languages →
 * source tag. Registers the (single) `onSetLanguageTag` listener that keeps
 * `<html lang>` in sync.
 */
export const initLocale = (): void => {
  onSetLanguageTag((tag) => {
    document.documentElement.lang = tag;
  });
  setLanguageTag(resolveLocale());
};
