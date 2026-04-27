import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const ONBOARDING_COMPLETED_KEY = "calca-onboarding-completed";

export const onboardingCompletedAtom = atomWithStorage<boolean>(ONBOARDING_COMPLETED_KEY, false);

export const showWelcomeAtom = atom(false);
export const showTutorialAtom = atom(false);
export const tutorialStepAtom = atom(0);
