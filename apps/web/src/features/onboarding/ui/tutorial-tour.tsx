// Copyright (c) 2026 Joaquin Terrasa. All rights reserved.
// Licensed under the AGPL-3.0. See packages/shared/LICENSE for details.

import { Tour, TourCard, TourOverlay, TourProvider, TourStep } from "@tour-kit/react";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";

import { currentTourStepIdAtom, showTutorialAtom } from "../state/onboarding-atoms";

export function TutorialTour(props: { onComplete?: () => void; hasFrames?: boolean }) {
  const { onComplete } = props;
  const setShowTutorial = useSetAtom(showTutorialAtom);
  const [, setCurrentTourStepId] = useAtom(currentTourStepIdAtom);
  const centerRef = useRef<HTMLElement>(null);
  // Ref to guard against multiple completions
  const completedRef = useRef(false);

  const handleStepChange = useCallback(
    (step: { id: string }, _index: number) => {
      setCurrentTourStepId(step.id);
    },
    [setCurrentTourStepId],
  );

  const handleComplete = useCallback(() => {
    // Prevent the function from running more than once
    if (completedRef.current) return;
    completedRef.current = true;

    setShowTutorial(false);
    setCurrentTourStepId(null);
    onComplete?.();
  }, [setShowTutorial, setCurrentTourStepId, onComplete]);

  const handleSkip = useCallback(() => {
    setShowTutorial(false);
    setCurrentTourStepId(null);
  }, [setShowTutorial, setCurrentTourStepId]);

  return (
    <TourProvider>
      <Tour
        id="tutorial"
        autoStart
        onComplete={handleComplete}
        onSkip={handleSkip}
        onStepChange={handleStepChange}
      >
        <TourStep
          id="prompt-bar"
          target='[data-tour="prompt-action-mode"]'
          title="The Prompt Bar"
          content="This is the prompt bar. Type your design idea here and press Enter or click the arrow to generate."
          showNavigation
          showClose
          showProgress
          placement="top"
        />
        <TourStep
          id="toolbar"
          target='[data-tour="toolbar-settings"]'
          title="Toolbar"
          content="Use the toolbar to adjust settings, view variations, and export your designs."
          showNavigation
          showClose
          showProgress
          placement="bottom"
        />
        <TourStep
          id="provider-setup"
          target='[data-tour="settings-provider"]'
          title="AI Provider"
          content="Select your AI provider from the dropdown. If you don't see any providers, you'll need to add one first."
          showNavigation
          showClose
          showProgress
          placement="bottom"
        />
        <TourStep
          id="add-provider"
          target='[data-tour="settings-add-provider"]'
          title="Add a Provider"
          content="Click here to add a new AI provider. You'll need to provide the provider's base URL and API key."
          showNavigation
          showClose
          showProgress
          placement="bottom"
        />
        <TourStep
          id="unsplash-key"
          target='[data-tour="settings-unsplash-key"]'
          title="Unsplash API Key"
          content="Add your Unsplash API key here to enable image generation in your designs."
          showNavigation
          showClose
          showProgress
          placement="top"
        />
        <TourStep
          id="all-set"
          target={centerRef}
          title="You're All Set!"
          content="You can restart this tour anytime from Settings → General."
          showNavigation
          showClose
          showProgress
          placement="bottom"
        />
      </Tour>
      <TourOverlay />
      <TourCard className="bg-background shadow-lg rounded-lg border border-border" />
      {/* Invisible centered target for the final modal-style step */}
      <div
        ref={centerRef as React.RefObject<HTMLDivElement>}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-px pointer-events-none"
        aria-hidden="true"
      />
    </TourProvider>
  );
}
