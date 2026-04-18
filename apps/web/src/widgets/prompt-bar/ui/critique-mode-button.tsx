"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Zap } from "lucide-react";
import { useViewportSize } from "../hooks/use-viewport-size";
import { useWindowEvent } from "../hooks/use-window-event";

interface CritiqueModeButtonProps {
  quickMode: boolean;
  onQuickModeChange: (quickMode: boolean) => void;
  showCritiqueMode: boolean;
  onToggle: () => void;
}

export function CritiqueModeButton({
  quickMode,
  onQuickModeChange,
  showCritiqueMode,
  onToggle,
}: CritiqueModeButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ bottom: number; right: number } | null>(null);
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();

  useLayoutEffect(() => {
    if (!showCritiqueMode || !containerRef.current) return;

    const buttonRect = containerRef.current.getBoundingClientRect();

    setPopoverPos({
      bottom: viewportHeight - buttonRect.top + 4,
      right: viewportWidth - buttonRect.right,
    });

    return () => setPopoverPos(null);
  }, [showCritiqueMode, viewportHeight, viewportWidth]);

  const handleClickOutside = (e: MouseEvent | PointerEvent) => {
    if (
      popoverRef.current &&
      !popoverRef.current.contains(e.target as Node) &&
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      onToggle();
    }
  };
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onToggle();
    }
  };
  useWindowEvent("mousedown", handleClickOutside);
  useWindowEvent("keydown", handleEscape);

  return (
    <div className="relative shrink-0 z-[60]" ref={containerRef}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
          quickMode
            ? "bg-[#CCCCCC]/90 text-gray-700 hover:bg-[#CCCCCC]"
            : "bg-[#FFCA00]/90 text-gray-900 hover:bg-[#FFCA00]"
        }`}
        title="Generation mode"
      >
        {quickMode ? <Zap className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
        <span>{quickMode ? "Quick" : "Critique"}</span>
      </button>

      {showCritiqueMode &&
        popoverPos &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[55] w-[260px] bg-white/20 backdrop-blur-3xl rounded-[20px] border border-white/30 shadow-[0_8px_40px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.15)] p-3"
            style={{
              bottom: `${popoverPos.bottom}px`,
              right: `${popoverPos.right}px`,
            }}
          >
            <div className="text-[10px] font-medium text-gray-500/80 uppercase tracking-wider mb-2">
              Generation mode
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onQuickModeChange(false);
                  onToggle();
                }}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${
                  !quickMode
                    ? "bg-[#FFCA00]/20 border border-[#FFCA00]/40"
                    : "bg-white/30 hover:bg-white/40"
                }`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    !quickMode ? "bg-[#FFCA00] text-gray-900" : "bg-yellow-100/80 text-yellow-600"
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[12px] font-semibold ${
                      !quickMode ? "text-yellow-700" : "text-gray-700"
                    }`}
                  >
                    Critique Loop
                  </div>
                  <div className="text-[10px] text-gray-500/80 leading-relaxed mt-0.5">
                    Sequential generation with AI feedback between each frame. Each design learns
                    from the previous one.
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickModeChange(true);
                  onToggle();
                }}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${
                  quickMode
                    ? "bg-[#CCCCCC]/30 border border-[#CCCCCC]/50"
                    : "bg-white/30 hover:bg-white/40"
                }`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    quickMode ? "bg-[#CCCCCC] text-gray-700" : "bg-gray-100/80 text-gray-500"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[12px] font-semibold ${
                      quickMode ? "text-gray-600" : "text-gray-700"
                    }`}
                  >
                    Quick Mode
                  </div>
                  <div className="text-[10px] text-gray-500/80 leading-relaxed mt-0.5">
                    Generate all designs in parallel without critique. Faster but less refined.
                  </div>
                </div>
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
