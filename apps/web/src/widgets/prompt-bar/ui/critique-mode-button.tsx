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
  dataTour?: string;
}

export function CritiqueModeButton({
  quickMode,
  onQuickModeChange,
  showCritiqueMode,
  onToggle,
  dataTour,
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
      </button>

      {showCritiqueMode &&
        popoverPos &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[55] w-[260px] bg-background/80 backdrop-blur-3xl rounded-[20px] border border-border/50 shadow-lg p-3"
            style={{
              bottom: `${popoverPos.bottom}px`,
              right: `${popoverPos.right}px`,
            }}
          >
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Generation mode
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onQuickModeChange(false);
                  onToggle();
                }}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-background/60 ${
                  !quickMode ? "border" : "bg-background/40"
                }`}
                style={
                  !quickMode
                    ? {
                        borderColor: "var(--mode-critique-fg)",
                        background: "var(--mode-critique-bg)",
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
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickModeChange(true);
                  onToggle();
                }}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-background/60 ${
                  quickMode ? "border" : "bg-background/40"
                }`}
                style={
                  quickMode
                    ? { borderColor: "var(--mode-quick-fg)", background: "var(--mode-quick-bg)" }
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
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
