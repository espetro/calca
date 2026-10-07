import { Dices, Minus, Plus } from "lucide-react";

import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "#/shared/components/ui/popover";

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
    <Popover
      open={showVariations}
      onOpenChange={(open) => {
        if (!open && showVariations) onToggle();
        if (open && !showVariations) onToggle();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          data-tour={dataTour}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
            disabled
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed border border-border/50"
              : conceptCount !== 1
                ? ""
                : "bg-glass-bg/60 text-muted-foreground hover:bg-glass-bg border border-border/50"
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
          title={m.promptbar_variationsTooltip()}
        >
          <Dices className="w-3.5 h-3.5" />
          <span>{m.promptbar_variations()}</span>
          {conceptCount !== 1 && (
            <span className="bg-foreground/10 px-1.5 py-0.5 rounded text-[10px]">
              {conceptCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[180px] bg-glass-bg/40 backdrop-blur-3xl rounded-[20px] border border-glass-border/50 shadow-glass p-4"
      >
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
          {m.promptbar_variationsPerPrompt()}
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label={m.promptbar_decreaseVariations()}
            onClick={() => onConceptCountChange(Math.max(1, conceptCount - 1))}
            disabled={conceptCount <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-glass-bg/60 hover:bg-glass-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4 text-muted-foreground" />
          </Button>
          <span
            aria-live="polite"
            className="text-lg font-semibold text-foreground min-w-[40px] text-center"
          >
            {conceptCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={m.promptbar_increaseVariations()}
            onClick={() => onConceptCountChange(Math.min(5, conceptCount + 1))}
            disabled={conceptCount >= 5}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-glass-bg/60 hover:bg-glass-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
