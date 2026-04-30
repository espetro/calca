import { useRef, useState } from "react";
import { ChevronDown, Shuffle } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/shared/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/shared/components/ui/tooltip";
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
  const [open, setOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const handleRemix = (prompt: string) => {
    setOpen(false);
    setCustomPrompt("");
    onRemix(iteration, prompt);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            asChild
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.preventDefault()}
          >
            <button
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-foreground/10 transition-all"
              data-tour="remix-button"
            >
              <Shuffle className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 ml-[-2px]" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">Remix</TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        align="start"
        side="bottom"
        sideOffset={4}
        className="min-w-[260px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] p-1.5 rounded-xl"
      >
        <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Quick remix
        </div>
        {REMIX_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.label}
            onClick={() => handleRemix(preset.prompt)}
            className="rounded-lg text-[13px] text-gray-700 hover:bg-black/5 cursor-pointer"
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
        <div className="my-1.5 border-t border-gray-200/30" />
        <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Custom
        </div>
        <div className="flex gap-1.5 px-1.5 pb-1">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customPrompt.trim()) {
                handleRemix(customPrompt.trim());
              }
            }}
            placeholder="Try it with..."
            className="flex-1 px-3 py-2 rounded-lg text-[13px] bg-black/5 outline-none placeholder-gray-400"
          />
          <button
            onClick={() => customPrompt.trim() && handleRemix(customPrompt.trim())}
            disabled={!customPrompt.trim()}
            className="px-3 py-2 rounded-lg text-[12px] font-medium text-white bg-blue-500/90 hover:bg-blue-500 disabled:opacity-40 transition-all"
          >
            Go
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { REMIX_PRESETS };
