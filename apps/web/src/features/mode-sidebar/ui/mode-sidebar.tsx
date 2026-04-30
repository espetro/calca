import type { ToolMode } from "#/shared/types";

import { ModeButtons } from "./mode-buttons";
import { PresetButton } from "./preset-button";
import { SystemPromptButton } from "./system-prompt-button";

interface ModeSidebarProps {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
}

export function ModeSidebar({ mode, onModeChange }: ModeSidebarProps) {
  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 p-2 rounded-2xl bg-toolbar-bg-transparent backdrop-blur-xl border border-border/40 shadow-[0_8px_32px_oklch(0_0_0_/_0.2),inset_0_1px_0_oklch(0_0_0_/_0.08)]"
    >
      <ModeButtons mode={mode} onModeChange={onModeChange} />

      <div className="w-5 h-px bg-foreground/15" />

      <PresetButton />

      <SystemPromptButton />
    </div>
  );
}
