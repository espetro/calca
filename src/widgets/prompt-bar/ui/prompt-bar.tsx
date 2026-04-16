"use client";

import { useState, useRef, useCallback } from "react";
import { Hammer, Sparkles } from "lucide-react";
import { useSettings } from "@/features/settings/hooks";
import {
  PromptInputContainer,
  PromptInputHeader,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
} from "./ai-prompt-input";
import { ImagePill } from "./image-pill";
import { AddMediaButton } from "./add-media-button";
import { VariationsButton } from "./variations-button";
import { CritiqueModeButton } from "./critique-mode-button";
import { usePromptHistory } from "../hooks/use-prompt-history";

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

interface PromptBarProps {
  onSubmit: (prompt: string) => void;
  isGenerating: boolean;
  genStatus?: string;
  onCancel?: () => void;
  imageCount?: number;
}

export function PromptBar({ onSubmit, isGenerating, genStatus, onCancel, imageCount = 0 }: PromptBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    settings,
    setIsIdeating,
    setVariations,
    setCritiqueMode,
    addImage,
    removeImage,
  } = useSettings();

  const { history, addToHistory, navigateHistory, resetHistoryIndex, clearDraft } = usePromptHistory({
    onSave: (prompt) => {
      setValue("");
      if (inputRef.current) inputRef.current.style.height = "auto";
    },
  });

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isGenerating) return;

    addToHistory(trimmed);
    onSubmit(trimmed);
  }, [value, isGenerating, addToHistory, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
    if (!input) return;

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const direction = e.key === "ArrowUp" ? "up" : "down";
      const newValue = navigateHistory(
        direction,
        value,
        { start: input.selectionStart, end: input.selectionEnd },
      );
      if (newValue !== value) {
        e.preventDefault();
        setValue(newValue);
      }
    }
  }, [handleSubmit, isGenerating, onCancel, value, navigateHistory]);

  const handleImageSelect = useCallback(async (files: File[]) => {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        addImage({ id: crypto.randomUUID(), src: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  }, [addImage]);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <PromptInputContainer isGenerating={isGenerating} data-tour="prompt-bar">
        {isGenerating ? (
          /* Compact status bar */
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 animate-spin shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
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
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
              {settings.selectedImages.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  {settings.selectedImages.map((image: { id: string; src: string }) => (
                    <ImagePill key={image.id} image={image} onRemove={removeImage} />
                  ))}
                </div>
              )}
            </PromptInputHeader>

            <PromptInputBody>
              <PromptInputTextarea
                ref={inputRef}
                value={value}
                onChange={(e) => { setValue(e.target.value); resetHistoryIndex(); }}
                onKeyDown={handleKeyDown}
                placeholder="Describe a design..."
                disabled={isGenerating}
              />
            </PromptInputBody>

            <PromptInputFooter>
              <div className="flex items-center gap-2">
                <AddMediaButton onSelect={handleImageSelect} />
                <VariationsButton
                  value={settings.variations}
                  onChange={setVariations}
                />
              </div>

              <div className="flex items-center gap-2">
                <CritiqueModeButton
                  active={settings.critiqueMode}
                  onClick={() => setCritiqueMode(!settings.critiqueMode)}
                />
                <button
                  onClick={() => setIsIdeating(!settings.isIdeating)}
                  disabled={isGenerating}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                    settings.isIdeating
                      ? "bg-violet-500/10 text-violet-700 hover:bg-violet-500/15 border border-violet-300/30"
                      : "bg-gray-900/10 text-gray-600 hover:bg-gray-900/15"
                  }`}
                  title={settings.isIdeating ? "Ideate mode" : "Build mode"}
                >
                  {settings.isIdeating ? "◈ Ideate" : "✦ Build"}
                </button>
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
  );
}
