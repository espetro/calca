import { Dices, Minus, Plus } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/shared/components/ui/popover";

const VARIATION_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: "transparent", color: "" },
  2: { bg: "var(--mode-variations-bg-subtle)", color: "var(--mode-variations-fg)" },
  3: { bg: "var(--mode-variations-bg-subtle)", color: "var(--mode-variations-fg)" },
  4: { bg: "var(--mode-variations-bg)", color: "var(--mode-variations-fg)" },
  5: { bg: "var(--mode-variations-bg)", color: "var(--mode-variations-fg)" },
};

interface VariationsButtonProps {
  conceptCount: number;
  onConceptCountChange: (count: number) => void;
  showVariations: boolean;
  onToggle: () => void;
  disabled?: boolean;
  dataTour?: string;
}

export function VariationsButton({
  conceptCount,
  onConceptCountChange,
  showVariations,
  onToggle,
  disabled = false,
  dataTour,
}: VariationsButtonProps) {
  return (
    <Popover open={showVariations} onOpenChange={(open) => {
      if (!open && showVariations) onToggle();
      if (open && !showVariations) onToggle();
    }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-tour={dataTour}
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
                  border:
                    conceptCount === 2 || conceptCount === 3
                      ? "1px solid var(--mode-variations-fg)"
                      : undefined,
                  color: VARIATION_COLORS[conceptCount]?.color,
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
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[180px] bg-white/20 backdrop-blur-3xl rounded-[20px] border border-white/30 shadow-[0_8px_40px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.15)] p-4"
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
      </PopoverContent>
    </Popover>
  );
}
