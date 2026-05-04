import { atom } from "jotai";

import type { CanvasImage } from "#/shared/types";
import type { GenerationGroup } from "#/shared/types";
import type { Point } from "#/shared/types/canvas";

/** Frames data stored in the internal Jotai clipboard atom */
export interface ClipboardFramesData {
  type: "frames";
  /** Groups (each group becomes a new group on paste) */
  groups: GenerationGroup[];
  /** Standalone canvas images copied with the frames */
  images: CanvasImage[];
  /** Relative positions (iteration id → {dx, dy} from bounding-box origin) */
  relativePositions: Record<string, Point>;
  /** Bounding-box origin of the original selection */
  origin: Point;
  createdAt: number;
}

export const clipboardAtom = atom<ClipboardFramesData | null>(null);
