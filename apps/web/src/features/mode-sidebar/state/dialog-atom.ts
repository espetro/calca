import { atom } from "jotai";

export type SidebarDialogType = "preset" | "system-prompt" | null;

export const sidebarDialogAtom = atom<SidebarDialogType>(null);
