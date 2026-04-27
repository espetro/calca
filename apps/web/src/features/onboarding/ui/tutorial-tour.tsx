// Copyright (c) 2026 Joaquin Terrasa. All rights reserved.
// Licensed under the AGPL-3.0. See packages/shared/LICENSE for details.

import { useCallback, useRef } from "react";
import { useSetAtom } from "jotai";
import { Tour, TourCard, TourOverlay, TourProvider, TourStep } from "@tour-kit/react";
import { showTutorialAtom } from "../state/onboarding-atoms";

export function TutorialTour(props: { onComplete?: () => void; hasFrames?: boolean }) {
  const { onComplete } = props;
  const setShowTutorial = useSetAtom(showTutorialAtom);
  const centerRef = useRef<HTMLElement>(null);

  const handleComplete = useCallback(() => {
    setShowTutorial(false);
    onComplete?.();
  }, [setShowTutorial, onComplete]);

  const handleSkip = useCallback(() => {
    setShowTutorial(false);
  }, [setShowTutorial]);

  return (
    <TourProvider>
      <Tour id="tutorial" autoStart onComplete={handleComplete} onSkip={handleSkip}>
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
