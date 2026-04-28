import { useAtom } from "jotai";
import { useCallback, useRef, useState } from "react";

import { settingsAtom } from "@/features/settings/state/settings-atoms";

import { usePromptHistory } from "../hooks/use-prompt-history";
import { AddMediaButton } from "./add-media-button";
import {
  PromptInputBody,
  PromptInputContainer,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputTextarea,
} from "./ai-prompt-input";
import { CritiqueModeButton } from "./critique-mode-button";
import { FloatingPresetButton } from "./floating-preset-button";
import { FloatingSystemPromptButton } from "./floating-system-prompt-button";
import { ImagePill } from "./image-pill";
import { VariationsButton } from "./variations-button";

const ArrowUpIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

interface ActionButtonProps {
  isGenerating: boolean;
}

const ActionButton = ({ isGenerating, dataTour }: ActionButtonProps & { dataTour?: string }) => {
  const [{ isIdeating }, setSettings] = useAtom(settingsAtom);

  const setIsIdeating = useCallback(
    (_: boolean) => setSettings((prev) => ({ ...prev, isIdeating: _ })),
    [setSettings],
  );

  return (
    <button
      onClick={() => setIsIdeating(!isIdeating)}
      disabled={isGenerating}
      data-tour={dataTour}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
      style={
        isIdeating
          ? {
              background: "var(--mode-ideate-bg)",
              border: "1px solid var(--mode-ideate-icon-bg)",
              color: "var(--mode-ideate-fg)",
            }
          : {
              background: "var(--mode-ideate-bg-subtle)",
              color: "var(--mode-ideate-fg)",
              opacity: 0.7,
            }
      }
      title={isIdeating ? "Ideate mode" : "Build mode"}
    >
      {isIdeating ? "◈ Ideate" : "✦ Build"}
    </button>
  );
};

interface PromptBarProps extends ActionButtonProps {
  genStatus?: string;
  onSubmit: (prompt: string) => void;
  onCancel?: () => void;
}

export function PromptBar({ onSubmit, isGenerating, genStatus, onCancel }: PromptBarProps) {
  const [value, setValue] = useState("");
  const [showCritiqueMode, setShowCritiqueMode] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const [settings, setSettings] = useAtom(settingsAtom);

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
    onSubmit(trimmed);
  }, [value, isGenerating, addToHistory, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (e.key === "Escape" && isGenerating) {
        onCancel?.();
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
    [handleSubmit, isGenerating, onCancel, value, navigateHistory],
  );

  const handleImageSelect = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be 5MB or smaller");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (!dataUrl.startsWith("data:image/")) {
          setError("Invalid image file");
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
                <svg
                  className="w-4 h-4 animate-spin shrink-0 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    opacity="0.2"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[13px] text-gray-500 font-medium truncate">
                  {genStatus || "Generating..."}
                </span>
              </div>
              <button
                onClick={onCancel}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-600 transition-all shrink-0"
                title="Cancel (Esc)"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            /* Full input bar */
            <>
              <PromptInputHeader>
                {/* Image pills */}
                {settings.selectedImages?.length > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    {settings.selectedImages.map((image) => (
                      <ImagePill key={image.id} image={image} onRemove={removeImage} />
                    ))}
                  </div>
                )}
                {error && <div className="text-xs text-red-400 mt-1 mb-1">{error}</div>}
                {showVisionWarning && (
                  <div className="text-xs text-amber-400/90 mt-1 mb-1 flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    This model may not support image input
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
                  placeholder="Describe a design..."
                  disabled={isGenerating}
                />
              </PromptInputBody>

              <PromptInputFooter>
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
                    quickMode={settings.quickMode}
                    onQuickModeChange={(quickMode) =>
                      setSettings((prev) => ({ ...prev, quickMode }))
                    }
                    showCritiqueMode={showCritiqueMode}
                    onToggle={handleToggleCritiqueMode}
                    dataTour="prompt-generation-mode"
                  />
                  <ActionButton isGenerating={isGenerating} dataTour="prompt-action-mode" />
                  <button
                    onClick={handleSubmit}
                    disabled={!value.trim() || isGenerating}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-900/80 backdrop-blur-sm text-white hover:bg-gray-800 disabled:opacity-25 disabled:hover:bg-gray-900/80 transition-all shrink-0"
                    title="Send (Enter)"
                  >
                    <ArrowUpIcon />
                  </button>
                </div>
              </PromptInputFooter>
            </>
          )}
        </PromptInputContainer>
      </div>

      {!isGenerating && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 pointer-events-auto">
          <FloatingPresetButton />
          <FloatingSystemPromptButton />
        </div>
      )}
    </>
  );
}
