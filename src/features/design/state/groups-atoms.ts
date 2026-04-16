import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { GenerationGroup } from "@/shared/types";

const STORAGE_KEY = "otto-canvas-session";

/**
 * Main design groups array, persisted to localStorage.
 *
 * NOTE: The existing hook's IndexedDB image handling (extractBase64/restoreBase64)
 * and debounced save logic will be handled separately via an effect or atom listener.
 */
export const groupsAtom = atomWithStorage<GenerationGroup[]>(STORAGE_KEY, []);

/**
 * Write-only atom that resets groups to an empty array.
 *
 * Usage:
 * ```ts
 * const resetSession = useSetAtom(resetSessionAtom);
 * ```
 */
export const resetSessionAtom = atom(null, (get, set) => {
  set(groupsAtom, []);
});
