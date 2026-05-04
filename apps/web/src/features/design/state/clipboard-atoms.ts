import { atom } from "jotai";

import type { GenerationGroup } from "#/shared/types";

export type FrameClipboardData = {
  type: "frame";
  data: GenerationGroup;
};

export const clipboardAtom = atom<FrameClipboardData | null>(null);
