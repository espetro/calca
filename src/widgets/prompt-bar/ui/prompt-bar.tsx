"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Hammer, Sparkles, Send } from "lucide-react";
import { useSettings } from "@/features/settings/hooks";
import {
  PromptInputContainer,
  PromptInputHeader,
  PromptInputBody,
  PromptInputTextarea,
} from "./ai-prompt-input";
import { ImagePill } from "./image-pill";
import { AddMediaButton } from "./add-media-button";
import { VariationsButton } from "./variations-button";
import { CritiqueModeButton } from "./critique-mode-button";

const HISTORY_KEY = "otto-prompt-history";
const MAX_HISTORY = 50;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(history: string[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {}
}

interface PromptBarProps {
  onSubmit: (prompt: string) => void;
  isGenerating: boolean;
  genStatus?: string;
  onCancel?: () => void;
  imageCount?: number;
}

export function PromptBar({ onSubmit, isGenerating, genStatus, onCancel, imageCount = 0 }: PromptBarProps) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    settings,
    setIsIdeating,
    setVariations,
    setCritiqueMode,
    addImage,
    removeImage,
  } = useSettings();

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isGenerating) return;

    const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    saveHistory(newHistory);

    onSubmit(trimmed);
    setValue("");
    setHistoryIndex(-1);
    setDraft("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  }, [value, isGenerating, history, onSubmit]);

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

    if (e.key === "ArrowUp" && input.selectionStart === 0 && input.selectionEnd === 0) {
      e.preventDefault();
      if (history.length === 0) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= history.length) return;
      if (historyIndex === -1) setDraft(value);
      setHistoryIndex(newIndex);
      setValue(history[newIndex]);
    }

    if (e.key === "ArrowDown" && input.selectionStart === value.length && input.selectionEnd === value.length) {
      e.preventDefault();
      if (historyIndex <= -1) return;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (newIndex === -1) setValue(draft);
      else setValue(history[newIndex]);
    }
  }, [handleSubmit, isGenerating, onCancel, history, historyIndex, value, draft]);

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
              {/* Build/Ideate toggle */}
              <button
                onClick={() => setIsIdeating(!settings.isIdeating)}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  settings.isIdeating
                    ? "bg-purple-500/20 backdrop-blur-sm border-purple-400/50 text-purple-300 shadow-sm"
                    : "bg-white/10 backdrop-blur-sm border-white/20 text-gray-400 hover:bg-white/15"
                }`}
                title={settings.isIdeating ? "Ideate mode" : "Build mode"}
              >
                {settings.isIdeating ? <Sparkles className="w-4 h-4" /> : <Hammer className="w-4 h-4" />}
                <span className="text-sm">{settings.isIdeating ? "Ideate" : "Build"}</span>
              </button>

              {/* Image pills */}
              {settings.selectedImages.map((image: { id: string; src: string }) => (
                <ImagePill key={image.id} image={image} onRemove={removeImage} />
              ))}

              {/* Add media button */}
              <AddMediaButton onSelect={handleImageSelect} />

              {/* Variations selector */}
              <VariationsButton
                value={settings.variations}
                onChange={setVariations}
              />

              {/* Critique mode toggle */}
              <CritiqueModeButton
                active={settings.critiqueMode}
                onClick={() => setCritiqueMode(!settings.critiqueMode)}
              />
            </PromptInputHeader>

            <PromptInputBody>
              <PromptInputTextarea
                ref={inputRef}
                value={value}
                onChange={(e) => { setValue(e.target.value); setHistoryIndex(-1); }}
                onKeyDown={handleKeyDown}
                placeholder="Describe a design..."
                disabled={isGenerating}
              />
              <button
                onClick={handleSubmit}
                disabled={!value.trim() || isGenerating}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-900/80 backdrop-blur-sm text-white hover:bg-gray-800 disabled:opacity-25 disabled:hover:bg-gray-900/80 transition-all shrink-0"
                title="Send (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </PromptInputBody>
          </>
        )}
      </PromptInputContainer>
    </div>
  );
}
