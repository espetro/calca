import { groupsAtom } from "@calca/canvas-flow";
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

// Selection writes also maintain the remix chip: a single selected generated
// frame seeds it; the chip clears when that frame leaves the selection. Keeping
// the side-effects in the atom write (not a component callback) lets
// onSelectedIdsChange stay the stable jotai setter — an unstable handler makes
// React Flow re-fire onSelectionChange, which writes a fresh Set and loops.
export const selectedIdsAtom = atom(
  (get) => get(selectedIdsBaseAtom),
  (get, set, update: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const prev = get(selectedIdsBaseAtom);
    const next = typeof update === "function" ? update(prev) : update;
    // React Flow re-emits onSelectionChange (fresh Set instance, same ids)
    // every time StoreUpdater syncs nodes — a no-op write would churn the atom
    // and re-render downstream subscribers into a setNodes loop.
    if (prev.size === next.size && [...prev].every((id) => next.has(id))) {
      return;
    }
    set(selectedIdsBaseAtom, next);
    const target = get(remixTargetAtom);
    if (target && !next.has(target.id)) {
      set(remixTargetAtom, null);
    }
    if (next.size === 1) {
      const onlyId = [...next][0];
      const iteration = get(groupsAtom)
        .flatMap((g) => g.iterations)
        .find((it) => it.id === onlyId);
      if (iteration && !iteration.isLoading && iteration.html) {
        set(remixTargetAtom, iteration);
      }
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
