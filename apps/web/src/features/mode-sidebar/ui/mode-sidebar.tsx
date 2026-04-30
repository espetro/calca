import { MousePointer, Pencil, SquareDashedMousePointer } from "lucide-react";

import type { ToolMode } from "#/shared/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/shared/components/ui/tooltip";

import ModeButton from "./mode-buttons";
import { PresetButton } from "./preset-button";
import { SystemPromptButton } from "./system-prompt-button";

interface ModeSidebarProps {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
}

export function ModeSidebar({ mode, onModeChange }: ModeSidebarProps) {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 p-2 rounded-2xl bg-toolbar-bg-transparent backdrop-blur-xl border border-border/40 shadow-[0_8px_32px_oklch(0_0_0_/_0.2),inset_0_1px_0_oklch(0_0_0_/_0.08)]">
      <Tooltip>
        <TooltipTrigger asChild>
          <ModeButton
            active={mode === "select"}
            onClick={() => onModeChange("select")}
            title=""
            color="select"
          >
            <MousePointer className="w-4 h-4" />
          </ModeButton>
        </TooltipTrigger>
        <TooltipContent side="left">Select – V</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <ModeButton
            active={mode === "draw-area"}
            onClick={() => onModeChange("draw-area")}
            title=""
            color="frame"
          >
            <SquareDashedMousePointer className="w-4 h-4" />
          </ModeButton>
        </TooltipTrigger>
        <TooltipContent side="left">Draw Area</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <ModeButton
            active={mode === "edit-component"}
            onClick={() => onModeChange("edit-component")}
            title=""
            color="component"
          >
            <Pencil className="w-4 h-4" />
          </ModeButton>
        </TooltipTrigger>
        <TooltipContent side="left">Edit Component</TooltipContent>
      </Tooltip>

      <div className="w-5 h-px bg-foreground/15" />

      <Tooltip>
        <TooltipTrigger asChild>
          <PresetButton />
        </TooltipTrigger>
        <TooltipContent side="left">Designer Preset</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <SystemPromptButton />
        </TooltipTrigger>
        <TooltipContent side="left">System Prompt</TooltipContent>
      </Tooltip>
    </div>
  );
}
