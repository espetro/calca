import { useViewportSize } from "@mantine/hooks";
import { useWindowEvent } from "@mantine/hooks";
import { Layers, RefreshCw, Zap } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "#/shared/components/ui/popover";

type GenerationMode = "fast" | "detailed";

interface CritiqueModeButtonProps {
  generationMode: GenerationMode;
  onGenerationModeChange: (mode: GenerationMode) => void;
  critiqueMode: boolean;
  onCritiqueModeChange: (enabled: boolean) => void;
  showCritiqueMode: boolean;
  onToggle: () => void;
  dataTour?: string;
}

export function CritiqueModeButton({
  generationMode,
  onGenerationModeChange,
  critiqueMode,
  onCritiqueModeChange,
  showCritiqueMode,
  onToggle,
  dataTour,
}: CritiqueModeButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ bottom: number; right: number } | null>(null);
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();

  useLayoutEffect(() => {
    if (!showCritiqueMode || !containerRef.current) {
      return;
    }

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

  useWindowEvent("mousedown", handleClickOutside);

  const isFast = generationMode === "fast";

  const ModeOption = ({
    mode,
    icon,
    title,
    description,
  }: {
    mode: GenerationMode;
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => {
    const active = generationMode === mode;
    const palette = mode === "fast" ? "quick" : "critique";
    return (
      <Button
        variant="ghost"
        onClick={() => onGenerationModeChange(mode)}
        className={`w-full h-auto flex items-start gap-3 p-2.5 rounded-xl text-left whitespace-normal transition-all hover:bg-background/60 ${
          active ? "border" : "bg-background/40"
        }`}
        style={
          active
            ? {
                background: `var(--mode-${palette}-bg)`,
                borderColor: `var(--mode-${palette}-fg)`,
              }
            : { background: `var(--mode-${palette}-bg-subtle)` }
        }
      >
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: active
              ? `var(--mode-${palette}-icon-bg)`
              : `var(--mode-${palette}-bg-subtle)`,
            color: `var(--mode-${palette}-fg)`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0 whitespace-normal">
          <div className="text-[12px] font-semibold" style={{ color: `var(--mode-${palette}-fg)` }}>
            {title}
          </div>
          <div
            className="text-[10px] leading-relaxed mt-0.5"
            style={{ color: `var(--mode-${palette}-fg)`, opacity: 0.7 }}
          >
            {description}
          </div>
        </div>
      </Button>
    );
  };

  return (
    <Popover
      open={showCritiqueMode}
      onOpenChange={(open) => {
        if (!open && showCritiqueMode) onToggle();
        if (open && !showCritiqueMode) onToggle();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-tour={dataTour}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
          style={
            isFast
              ? { background: "var(--mode-quick-bg)", color: "var(--mode-quick-fg)" }
              : { background: "var(--mode-critique-bg)", color: "var(--mode-critique-fg)" }
          }
          title={m.promptbar_generationMode()}
        >
          {isFast ? <Zap className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
          <span>{isFast ? m.promptbar_fast() : m.promptbar_detailed()}</span>
          {critiqueMode && <RefreshCw className="w-3 h-3 opacity-60" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-[260px] bg-background/80 backdrop-blur-3xl rounded-[20px] border border-border/50 shadow-lg p-3"
      >
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {m.promptbar_generationMode()}
        </div>
        <div className="space-y-2">
          <ModeOption
            mode="fast"
            icon={<Zap className="w-4 h-4" />}
            title={m.promptbar_fastMode()}
            description={m.promptbar_fastModeDesc()}
          />
          <ModeOption
            mode="detailed"
            icon={<Layers className="w-4 h-4" />}
            title={m.promptbar_detailedMode()}
            description={m.promptbar_detailedModeDesc()}
          />
        </div>
        <div className="mt-3 pt-3 border-t border-border/50">
          <button
            type="button"
            role="switch"
            aria-checked={critiqueMode}
            onClick={() => onCritiqueModeChange(!critiqueMode)}
            className="w-full flex items-center gap-3 p-1.5 rounded-lg text-left transition-colors hover:bg-background/60"
          >
            <div
              className={`relative w-7 h-4 rounded-full transition-colors ${
                critiqueMode ? "bg-emerald-500" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                  critiqueMode ? "translate-x-3" : ""
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-foreground">
                {m.promptbar_critiqueToggle()}
              </div>
              <div className="text-[10px] leading-relaxed text-muted-foreground">
                {m.promptbar_critiqueToggleDesc()}
              </div>
            </div>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
