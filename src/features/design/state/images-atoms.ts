import { atom } from "jotai";
import type { CanvasImage } from "@/shared/types";

export const canvasImagesAtom = atom<CanvasImage[]>([]);
