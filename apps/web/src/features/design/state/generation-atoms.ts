import { atom } from "jotai";

import type { DesignIteration, PipelineStatus, ToolMode } from "#/shared/types";

export const showResetConfirmAtom = atom<boolean>(false);

export const toolModeAtom = atom<ToolMode>("select");

export const isGeneratingAtom = atom<boolean>(false);

export const pipelineStagesAtom = atom<Record<string, PipelineStatus>>({});

export const genStatusAtom = atom<string>("");

/** ms epoch when the active generation started (drives elapsed-time display). */
export const genStartedAtAtom = atom<number | null>(null);

export const spaceHeldAtom = atom<boolean>(false);

export const showGitHashAtom = atom<boolean>(false);

export const showLibraryAtom = atom<boolean>(false);

export const remixTargetAtom = atom<DesignIteration | null>(null);

const selectedIdsBaseAtom = atom<Set<string>>(new Set<string>());

// Selection writes also drop the seeded remix target when its frame leaves the
// selection — covers every mutation path (pane click, Escape, Delete,
// multi-select) without each call site knowing about the chip.
export const selectedIdsAtom = atom(
  (get) => get(selectedIdsBaseAtom),
  (get, set, update: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const prev = get(selectedIdsBaseAtom);
    const next = typeof update === "function" ? update(prev) : update;
    set(selectedIdsBaseAtom, next);
    const target = get(remixTargetAtom);
    if (target && !next.has(target.id)) {
      set(remixTargetAtom, null);
    }
  },
);

export const rubberBandAtom = atom<{
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null>(null);

export const draggingImageIdAtom = atom<string | null>(null);

/** Prompt text injected via ?prompt= deep link, consumed once by the prompt bar. */
export const pendingPromptAtom = atom<string | null>(null);
