import { describe, it, expect } from "vitest";
import {
  showWelcomeAtom,
  showTutorialAtom,
  onboardingCompletedAtom,
  tutorialStepAtom,
} from "./onboarding-atoms";
import { getDefaultStore } from "jotai";

describe("onboarding atoms", () => {
  const store = getDefaultStore();

  it("showWelcomeAtom defaults to false", () => {
    expect(store.get(showWelcomeAtom)).toBe(false);
  });

  it("showTutorialAtom defaults to false", () => {
    expect(store.get(showTutorialAtom)).toBe(false);
  });

  it("onboardingCompletedAtom defaults to false", () => {
    expect(store.get(onboardingCompletedAtom)).toBe(false);
  });

  it("tutorialStepAtom defaults to 0", () => {
    expect(store.get(tutorialStepAtom)).toBe(0);
  });

  it("setting onboardingCompleted to true works", () => {
    store.set(onboardingCompletedAtom, true);
    expect(store.get(onboardingCompletedAtom)).toBe(true);
    store.set(onboardingCompletedAtom, false);
  });

  it("showWelcomeAtom can be toggled", () => {
    store.set(showWelcomeAtom, true);
    expect(store.get(showWelcomeAtom)).toBe(true);
    store.set(showWelcomeAtom, false);
    expect(store.get(showWelcomeAtom)).toBe(false);
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
