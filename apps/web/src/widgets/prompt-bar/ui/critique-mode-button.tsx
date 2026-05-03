import { RefreshCw, Zap } from "lucide-react";

import { Button } from "#/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/shared/components/ui/popover";

interface CritiqueModeButtonProps {
  quickMode: boolean;
  onQuickModeChange: (quickMode: boolean) => void;
  showCritiqueMode: boolean;
  onToggle: () => void;
  dataTour?: string;
}

export function CritiqueModeButton({
  quickMode,
  onQuickModeChange,
  showCritiqueMode,
  onToggle,
  dataTour,
}: CritiqueModeButtonProps) {
  return (
    <Popover open={showCritiqueMode} onOpenChange={(open) => {
      if (!open && showCritiqueMode) onToggle();
      if (open && !showCritiqueMode) onToggle();
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          data-tour={dataTour}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
          style={
            quickMode
              ? { background: "var(--mode-quick-bg)", color: "var(--mode-quick-fg)" }
              : { background: "var(--mode-critique-bg)", color: "var(--mode-critique-fg)" }
          }
          title="Generation mode"
        >
          {quickMode ? <Zap className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>{quickMode ? "Quick" : "Critique"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-[260px] bg-background/80 backdrop-blur-3xl rounded-[20px] border border-border/50 shadow-lg p-3"
      >
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Generation mode
        </div>
        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={() => {
              onQuickModeChange(false);
              onToggle();
            }}
            className={`w-full h-auto flex items-start gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-background/60 ${
              !quickMode ? "border" : "bg-background/40"
            }`}
            style={
              !quickMode
                ? {
                    background: "var(--mode-critique-bg)",
                    borderColor: "var(--mode-critique-fg)",
                  }
                : { background: "var(--mode-critique-bg-subtle)" }
            }
          >
            <div
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center`}
              style={
                !quickMode
                  ? {
                      background: "var(--mode-critique-icon-bg)",
                      color: "var(--mode-critique-fg)",
                    }
                  : {
                      background: "var(--mode-critique-bg-subtle)",
                      color: "var(--mode-critique-fg)",
                    }
              }
            >
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[12px] font-semibold"
                style={{ color: "var(--mode-critique-fg)" }}
              >
                Critique Loop
              </div>
              <div
                className="text-[10px] leading-relaxed mt-0.5"
                style={{ color: "var(--mode-critique-fg)", opacity: 0.7 }}
              >
                Sequential generation with AI feedback between each frame. Each design learns
                from the previous one.
              </div>
            </div>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              onQuickModeChange(true);
              onToggle();
            }}
            className={`w-full h-auto flex items-start gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-background/60 ${
              quickMode ? "border" : "bg-background/40"
            }`}
            style={
              quickMode
                ? { background: "var(--mode-quick-bg)", borderColor: "var(--mode-quick-fg)" }
                : { background: "var(--mode-quick-bg-subtle)" }
            }
          >
            <div
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center`}
              style={
                quickMode
                  ? { background: "var(--mode-quick-icon-bg)", color: "var(--mode-quick-fg)" }
                  : { background: "var(--mode-quick-bg-subtle)", color: "var(--mode-quick-fg)" }
              }
            >
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[12px] font-semibold"
                style={{ color: "var(--mode-quick-fg)" }}
              >
                Quick Mode
              </div>
              <div
                className="text-[10px] leading-relaxed mt-0.5"
                style={{ color: "var(--mode-quick-fg)", opacity: 0.7 }}
              >
                Generate all designs in parallel without critique. Faster but less refined.
              </div>
            </div>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
