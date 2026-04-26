import { useViewportSize } from "../hooks/use-viewport-size";
import { useWindowEvent } from "../hooks/use-window-event";
import { Dices, Minus, Plus } from "lucide-react";
import { useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const VARIATION_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: "transparent", color: "" },
  2: { bg: "oklch(0.76 0.0952 76.06 / 0.20)", color: "oklch(0.76 0.0952 76.06)" },
  3: { bg: "oklch(0.76 0.0952 76.06 / 0.40)", color: "oklch(0.76 0.0952 76.06)" },
  4: { bg: "oklch(0.76 0.0952 76.06 / 0.80)", color: "#fff" },
  5: { bg: "oklch(0.76 0.0952 76.06)", color: "#fff" },
};

interface VariationsButtonProps {
  conceptCount: number;
  onConceptCountChange: (count: number) => void;
  showVariations: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function VariationsButton({
  conceptCount,
  onConceptCountChange,
  showVariations,
  onToggle,
  disabled = false,
}: VariationsButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ bottom: number; left: number } | null>(null);
  const { height: viewportHeight } = useViewportSize();

  useLayoutEffect(() => {
    if (!showVariations || !containerRef.current) return;

    const buttonRect = containerRef.current.getBoundingClientRect();

    setPopoverPos({
      bottom: viewportHeight - buttonRect.top + 8,
      left: buttonRect.left,
    });

    return () => setPopoverPos(null);
  }, [showVariations, viewportHeight]);

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
    if (e.key === "Escape" && showVariations) {
      onToggle();
    }
  };

  useWindowEvent("mousedown", handleClickOutside);
  useWindowEvent("keydown", handleEscape);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
          disabled
            ? "bg-gray-100/50 text-gray-400 cursor-not-allowed border border-gray-200/50"
            : conceptCount !== 1
              ? ""
              : "bg-white/50 text-gray-600 hover:bg-white/80 border border-gray-200/50"
        }`}
        style={
          !disabled && conceptCount !== 1
            ? {
                backgroundColor: VARIATION_COLORS[conceptCount]?.bg,
                color: VARIATION_COLORS[conceptCount]?.color,
                border:
                  conceptCount === 2 || conceptCount === 3
                    ? "1px solid oklch(0.76 0.0952 76.06 / 0.4)"
                    : undefined,
              }
            : undefined
        }
        title="Number of design variations to generate"
      >
        <Dices className="w-3.5 h-3.5" />
        <span>Variations</span>
        {conceptCount !== 1 && (
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{conceptCount}</span>
        )}
      </button>

      {showVariations &&
        popoverPos &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[55] w-[180px] bg-white/20 backdrop-blur-3xl rounded-[20px] border border-white/30 shadow-[0_8px_40px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.15)] p-4"
            style={{
              bottom: `${popoverPos.bottom}px`,
              left: `${popoverPos.left}px`,
            }}
          >
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">
              Variations per prompt
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onConceptCountChange(Math.max(1, conceptCount - 1))}
                disabled={conceptCount <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/50 hover:bg-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-lg font-semibold text-gray-800 min-w-[40px] text-center">
                {conceptCount}
              </span>
              <button
                type="button"
                onClick={() => onConceptCountChange(Math.min(5, conceptCount + 1))}
                disabled={conceptCount >= 5}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/50 hover:bg-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
