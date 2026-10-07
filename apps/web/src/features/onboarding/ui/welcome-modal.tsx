// Copyright (c) 2026 Joaquin Terrasa. All rights reserved.
// Licensed under the AGPL-3.0. See packages/shared/LICENSE for details.

import { Download, LayoutGrid, Sparkles } from "lucide-react";

import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/shared/components/ui/dialog";

interface WelcomeModalProps {
  open?: boolean;
  onTakeTour?: () => void;
  onSkip?: () => void;
  onComplete?: (keys: {
    anthropicKey: string;
    geminiKey: string;
    unsplashKey: string;
    openaiKey: string;
  }) => void;
  onDismiss?: () => void;
}

const features = [
  {
    icon: Sparkles,
    get text() {
      return m.onboarding_featureDesignAi();
    },
  },
  {
    icon: LayoutGrid,
    get text() {
      return m.onboarding_featureCompare();
    },
  },
  {
    icon: Download,
    get text() {
      return m.onboarding_featureExport();
    },
  },
];

export function WelcomeModal({
  open = true,
  onTakeTour,
  onSkip,
  onComplete,
  onDismiss,
}: WelcomeModalProps) {
  const handleTakeTour = () => {
    if (onTakeTour) {
      onTakeTour();
    } else if (onComplete) {
      onComplete({
        anthropicKey: "",
        geminiKey: "",
        openaiKey: "",
        unsplashKey: "",
      });
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="gap-3">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {m.onboarding_welcomeModalTitle()}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {m.onboarding_welcomeModalDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <feature.icon className="size-4 text-primary" />
              </div>
              <p className="text-sm leading-relaxed text-foreground">{feature.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleSkip}>
            {m.onboarding_skip()}
          </Button>
          <Button onClick={handleTakeTour}>{m.onboarding_takeTour()}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
