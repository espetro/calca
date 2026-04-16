import { atom } from "jotai";
import type { Point } from "@/shared/types/canvas";

export const canvasOffsetAtom = atom<Point>({ x: 0, y: 0 });
export const canvasScaleAtom = atom<number>(1);
export const isPanningAtom = atom<boolean>(false);
