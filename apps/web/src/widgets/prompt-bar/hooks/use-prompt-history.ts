import { useState, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const HISTORY_KEY = "calca-prompt-history";
const MAX_HISTORY = 50;

const historyAtom = atomWithStorage<string[]>(HISTORY_KEY, []);

interface UsePromptHistoryOptions {
  onSave?: (prompt: string) => void;
}

export function usePromptHistory(options: UsePromptHistoryOptions = {}) {
  const [history, setHistory] = useAtom(historyAtom);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draft, setDraft] = useState("");
  const isNavigatingRef = useRef(false);

  const addToHistory = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
      setHistory(newHistory);

      setHistoryIndex(-1);
      setDraft("");
      isNavigatingRef.current = false;

      options.onSave?.(trimmed);
    },
    [history, setHistory, options],
  );

  const navigateHistory = useCallback(
    (
      direction: "up" | "down",
      currentValue: string,
      cursorPosition: { start: number; end: number },
    ) => {
      if (direction === "up" && (cursorPosition.start !== 0 || cursorPosition.end !== 0)) {
        return currentValue;
      }
      if (
        direction === "down" &&
        (cursorPosition.start !== currentValue.length || cursorPosition.end !== currentValue.length)
      ) {
        return currentValue;
      }

      if (direction === "up") {
        if (history.length === 0) return currentValue;
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) return currentValue;

        if (historyIndex === -1) {
          setDraft(currentValue);
        }
        setHistoryIndex(newIndex);
        isNavigatingRef.current = true;
        return history[newIndex];
      }

      if (historyIndex <= -1) return currentValue;

      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (newIndex === -1) {
        isNavigatingRef.current = false;
        return draft;
      }
      isNavigatingRef.current = true;
      return history[newIndex];
    },
    [history, historyIndex, draft],
  );

  const resetHistoryIndex = useCallback(() => {
    setHistoryIndex(-1);
  }, []);

  const clearDraft = useCallback(() => {
    setDraft("");
  }, []);

  return {
    history,
    addToHistory,
    navigateHistory,
    resetHistoryIndex,
    clearDraft,
  };
}
