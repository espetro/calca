import { atom } from "jotai";

import type { PipelineStatus, ToolMode } from "@/shared/types";

export const showResetConfirmAtom = atom<boolean>(false);

export const toolModeAtom = atom<ToolMode>("select");

export const isGeneratingAtom = atom<boolean>(false);

export const pipelineStagesAtom = atom<Record<string, PipelineStatus>>({});

export const genStatusAtom = atom<string>("");

export const spaceHeldAtom = atom<boolean>(false);

export const showGitHashAtom = atom<boolean>(false);

export const showLibraryAtom = atom<boolean>(false);

export const selectedIdsAtom = atom<Set<string>>(new Set<string>());

export const rubberBandAtom = atom<{
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null>(null);

export const draggingImageIdAtom = atom<string | null>(null);
