import { atom } from "jotai";

export const showWelcomeAtom = atom(false);
export const showTutorialAtom = atom(false);
export const tutorialStepAtom = atom(0);
export const currentTourStepIdAtom = atom<string | null>(null);
