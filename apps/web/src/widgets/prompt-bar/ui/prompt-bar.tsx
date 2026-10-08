import { useAtom } from "jotai";
import { AlertTriangle, Shuffle, ArrowRight, Loader2, X } from "lucide-react";
import { ComponentProps, useCallback, useEffect, useRef, useState } from "react";

import { pendingPromptAtom, remixTargetAtom } from "#/features/design/state/generation-atoms";
import { settingsAtom } from "#/features/settings/state/settings-atoms";
import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";
import { useNow } from "#/shared/hooks/use-now";
import type { DesignIteration } from "#/shared/types";

import { usePromptHistory } from "../hooks/use-prompt-history";
import ActionButton, { ActionButtonProps } from "./action-button";
import { AddMediaButton } from "./add-media-button";
import {
  PromptInputBody,
  PromptInputContainer,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputTextarea,
} from "./ai-prompt-input";
import { CritiqueModeButton } from "./critique-mode-button";
import { ImagePill } from "./image-pill";
import { VariationsButton } from "./variations-button";

interface SubmitButtonProps extends ComponentProps<"button"> {
  onSubmit: () => void;
}

const SubmitButton = ({ onSubmit, className, ...props }: SubmitButtonProps) => {
  return (
    <Button
      {...props}
      variant="ghost"
      size="icon"
      onClick={onSubmit}
      className={`w-8 h-8 rounded-full bg-primary backdrop-blur-sm text-primary-foreground hover:bg-primary/85 disabled:opacity-25 disabled:hover:bg-primary transition-all shrink-0 ${className}`}
      title={m.promptbar_send()}
    >
      <ArrowRight />
    </Button>
  );
};

interface PromptBarProps extends ActionButtonProps {
  genStatus?: string;
  /** ms epoch when generation started; drives the elapsed-time readout. */
  genStartedAt?: number | null;
  onSubmit: (prompt: string) => void;
  onRemix?: (iteration: DesignIteration, prompt: string) => void;
  onCancel?: () => void;
}

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export function PromptBar({
  onSubmit,
  onRemix,
  isGenerating,
  genStatus,
  genStartedAt,
  onCancel,
}: PromptBarProps) {
  const [value, setValue] = useState("");
  const [showCritiqueMode, setShowCritiqueMode] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const now = useNow(1000, !!isGenerating);

  const handleToggleVariations = () => {
    setShowVariations((prev) => {
      const next = !prev;
      if (next) {
        setShowCritiqueMode(false);
      }
      return next;
    });
  };

  const handleToggleCritiqueMode = () => {
    setShowCritiqueMode((prev) => {
      const next = !prev;
      if (next) {
        setShowVariations(false);
      }
      return next;
    });
  };

  const [remixTarget, setRemixTarget] = useAtom(remixTargetAtom);
  const [settings, setSettings] = useAtom(settingsAtom);
  const [pendingPrompt, setPendingPrompt] = useAtom(pendingPromptAtom);

  useEffect(() => {
    if (remixTarget) inputRef.current?.focus();
  }, [remixTarget]);

  // ?prompt= deep link: prefill once, then clear.
  useEffect(() => {
    if (!pendingPrompt) return;
    setValue(pendingPrompt);
    setPendingPrompt(null);
    inputRef.current?.focus();
  }, [pendingPrompt, setPendingPrompt]);

  // The textarea unmounts while generating, so Escape must be handled globally.
  useEffect(() => {
    if (!isGenerating || !onCancel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isGenerating, onCancel]);

  const addImage = useCallback(
    (image: { id: string; src: string; name?: string }) => {
      setError(null);
      setSettings((prev) => ({
        ...prev,
        selectedImages: [...(prev.selectedImages || []), image],
      }));
    },
    [setSettings],
  );

  const removeImage = useCallback(
    (id: string) => {
      setError(null);
      setSettings((prev) => ({
        ...prev,
        selectedImages: prev.selectedImages?.filter((img) => img.id !== id) || [],
      }));
    },
    [setSettings],
  );

  const { addToHistory, navigateHistory, resetHistoryIndex } = usePromptHistory({
    onSave: (prompt) => {
      setValue("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    },
  });

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isGenerating) {
      return;
    }

    addToHistory(trimmed);
    if (remixTarget && onRemix) {
      onRemix(remixTarget, trimmed);
      setRemixTarget(null);
    } else {
      onSubmit(trimmed);
    }
  }, [value, isGenerating, addToHistory, onSubmit, onRemix, remixTarget, setRemixTarget]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
        return;
      }

      const input = inputRef.current;
      if (!input) {
        return;
      }

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const direction = e.key === "ArrowUp" ? "up" : "down";
        const newValue = navigateHistory(direction, value, {
          end: input.selectionEnd,
          start: input.selectionStart,
        });
        if (newValue !== value) {
          e.preventDefault();
          setValue(newValue);
        }
      }
    },
    [handleSubmit, isGenerating, value, navigateHistory],
  );

  const handleImageSelect = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        setError(m.promptbar_errorImageTooLarge());
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (!dataUrl.startsWith("data:image/")) {
          setError(m.promptbar_errorInvalidImage());
          return;
        }
        addImage({ id: crypto.randomUUID(), name: file.name, src: dataUrl });
      };
      reader.readAsDataURL(file);
    },
    [addImage],
  );

  const isVisionModel = (model: string): boolean => {
    const visionKeywords = ["vision", "gpt-4o", "gpt-4-turbo", "claude-3", "gemini"];
    const lowerModel = model.toLowerCase();
    return visionKeywords.some((keyword) => lowerModel.includes(keyword));
  };

  const showVisionWarning =
    settings.selectedImages?.length > 0 && settings.model && !isVisionModel(settings.model);

  return (
    <>
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <PromptInputContainer isGenerating={isGenerating} data-tour="prompt-bar">
          {isGenerating ? (
            /* Compact status bar */
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2 min-w-0">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-muted-foreground" />
                <span className="text-[13px] text-muted-foreground font-medium truncate">
                  {genStatus || m.promptbar_generating()}
                </span>
                {genStartedAt != null && (
                  <span className="text-[12px] text-muted-foreground/80 tabular-nums shrink-0">
                    {formatElapsed(now - genStartedAt)}
                  </span>
                )}
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={onCancel}
                className="w-8 h-8 rounded-lg bg-destructive/80 backdrop-blur-sm text-destructive-foreground hover:bg-destructive transition-all shrink-0"
                title={m.promptbar_cancel()}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            /* Full input bar */
            <>
              <PromptInputHeader>
                {/* Remix mode chip */}
                {remixTarget && (
                  <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-2.5 py-1 text-[12px] text-primary shrink-0">
                    <Shuffle className="w-3 h-3 shrink-0" />
                    <span>
                      {m.promptbar_remixing()}{" "}
                      <span className="font-medium">
                        {remixTarget.label ?? m.promptbar_remixFallback()}
                      </span>
                    </span>
                    <button
                      onClick={() => setRemixTarget(null)}
                      className="ml-0.5 hover:text-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {/* Image pills */}
                {settings.selectedImages?.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    {settings.selectedImages.map((image) => (
                      <ImagePill key={image.id} image={image} onRemove={removeImage} />
                    ))}
                  </div>
                )}
                {error && <div className="text-xs text-destructive mt-1 mb-1">{error}</div>}
                {showVisionWarning && (
                  <div className="text-xs text-amber-400/90 mt-1 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {m.promptbar_visionWarning()}
                  </div>
                )}
              </PromptInputHeader>

              <PromptInputBody>
                <PromptInputTextarea
                  ref={inputRef}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    resetHistoryIndex();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    remixTarget ? m.promptbar_placeholderRemix() : m.promptbar_placeholder()
                  }
                  disabled={isGenerating}
                />
              </PromptInputBody>

              <PromptInputFooter className="pt-2">
                <div className="flex items-center gap-2">
                  <AddMediaButton onFileSelect={handleImageSelect} disabled={isGenerating} />
                  <VariationsButton
                    conceptCount={settings.conceptCount}
                    onConceptCountChange={(count) =>
                      setSettings((prev) => ({ ...prev, conceptCount: count }))
                    }
                    showVariations={showVariations}
                    onToggle={handleToggleVariations}
                    dataTour="prompt-variations"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <CritiqueModeButton
                    generationMode={settings.generationMode ?? "detailed"}
                    onGenerationModeChange={(generationMode) =>
                      setSettings((prev) => ({ ...prev, generationMode }))
                    }
                    critiqueMode={settings.critiqueMode}
                    onCritiqueModeChange={(critiqueMode) =>
                      setSettings((prev) => ({ ...prev, critiqueMode }))
                    }
                    showCritiqueMode={showCritiqueMode}
                    onToggle={handleToggleCritiqueMode}
                    dataTour="prompt-generation-mode"
                  />
                  <ActionButton isGenerating={isGenerating} dataTour="prompt-action-mode" />
                  <SubmitButton onSubmit={handleSubmit} disabled={!value.trim() || isGenerating} />
                </div>
              </PromptInputFooter>
            </>
          )}
        </PromptInputContainer>
      </div>
    </>
  );
}
