import { atom } from "jotai";

import type { Comment, Point } from "@/shared/types";

export const commentDraftAtom = atom<{
  iterationId: string;
  position: Point;
  screenX: number;
  screenY: number;
} | null>(null);

export const draggingIdAtom = atom<string | null>(null);

export const activeCommentAtom = atom<Comment | null>(null);

export const activeCommentIterationIdAtom = atom<string | null>(null);

export const commentCountAtom = atom<number>(0);
