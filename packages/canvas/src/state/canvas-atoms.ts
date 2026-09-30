import type { Point } from "@app/shared";
import { atom } from "jotai";

export const canvasOffsetAtom = atom<Point>({ x: 0, y: 0 });
export const canvasScaleAtom = atom<number>(1);
export const isPanningAtom = atom<boolean>(false);
