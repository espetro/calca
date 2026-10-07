import { useSetAtom } from "jotai";
import { ChevronDown, PenLine, Shuffle } from "lucide-react";
import { useState } from "react";

import { remixTargetAtom } from "#/features/design/state/generation-atoms";
import { Popover, PopoverContent, PopoverTrigger } from "#/shared/components/ui/popover";
import type { DesignIteration } from "#/shared/types";

const REMIX_PRESETS = [
  {
    label: "🎨 Different colors",
    prompt: "Same layout and content, but try 4 completely different color palettes",
  },
  {
    label: "📐 Different layouts",
    prompt: "Same content and message, but try 4 completely different layouts and compositions",
  },
  {
    label: "🔤 Different typography",
    prompt: "Same layout and colors, but try 4 different typography styles and font pairings",
  },
  {
    label: "✨ More minimal",
    prompt: "Same concept but much more minimal — fewer elements, more whitespace, simpler",
  },
  {
    label: "🔥 More bold",
    prompt: "Same concept but much bolder — bigger type, stronger colors, more visual impact",
  },
];

interface RemixButtonProps {
  iteration: DesignIteration;
  onRemix: (iteration: DesignIteration, prompt: string) => void;
}

export function RemixButton({ iteration, onRemix }: RemixButtonProps) {
  const setRemixTarget = useSetAtom(remixTargetAtom);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-all duration-200 rounded-xl group"
          data-tour="remix-button"
        >
          <Shuffle className="w-4 h-4" />
          <span>Remix</span>
          <ChevronDown className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="center"
        side="bottom"
        sideOffset={8}
        className="w-[240px] bg-glass-bg backdrop-blur-2xl border border-glass-border shadow-glass p-1.5 rounded-xl flex flex-col"
      >
        <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Quick remix
        </div>
        {REMIX_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              onRemix(iteration, preset.prompt);
              setOpen(false);
            }}
            className="w-full rounded-lg text-[13px] text-foreground hover:bg-foreground/5 cursor-pointer text-left px-2 py-1.5"
          >
            {preset.label}
          </button>
        ))}
        <div className="my-1.5 border-t border-border/30" />
        <button
          onClick={() => {
            setRemixTarget(iteration);
            setOpen(false);
          }}
          className="w-full rounded-lg text-[13px] text-muted-foreground hover:bg-foreground/5 cursor-pointer text-left px-2 py-1.5 flex items-center gap-1.5"
        >
          <PenLine className="w-3.5 h-3.5" />
          <span>Custom…</span>
        </button>
      </PopoverContent>
    </Popover>
  );
}

export { REMIX_PRESETS };
