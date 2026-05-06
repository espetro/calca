import { getDefaultStore } from "jotai";
import { describe, expect, it } from "vitest";

import { showTutorialAtom, tutorialStepAtom } from "./onboarding-atoms";

describe("onboarding atoms", () => {
  const store = getDefaultStore();

  it("showTutorialAtom defaults to false", () => {
    expect(store.get(showTutorialAtom)).toBe(false);
  });

  it("tutorialStepAtom defaults to 0", () => {
    expect(store.get(tutorialStepAtom)).toBe(0);
  });

  it("showTutorialAtom can be toggled", () => {
    store.set(showTutorialAtom, true);
    expect(store.get(showTutorialAtom)).toBe(true);
    store.set(showTutorialAtom, false);
    expect(store.get(showTutorialAtom)).toBe(false);
  });

  it("tutorialStepAtom can be incremented", () => {
    store.set(tutorialStepAtom, 2);
    expect(store.get(tutorialStepAtom)).toBe(2);
    store.set(tutorialStepAtom, 0);
  });
});
