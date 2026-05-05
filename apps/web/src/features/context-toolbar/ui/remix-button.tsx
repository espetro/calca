import { useSetAtom } from "jotai";
import { PenLine, Shuffle } from "lucide-react";

import { remixTargetAtom } from "#/features/design/state/generation-atoms";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "#/shared/components/ui/navigation-menu";
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

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-100/80 hover:text-gray-800 transition-all duration-200 rounded-xl group"
        data-tour="remix-button"
      >
        <Shuffle className="w-4 h-4" />
        <span>Remix</span>
      </NavigationMenuTrigger>

      <NavigationMenuContent
        className="w-[240px] md:w-[240px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] p-1.5 rounded-xl flex flex-col"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Quick remix
        </div>
        {REMIX_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onRemix(iteration, preset.prompt)}
            className="w-full rounded-lg text-[13px] text-gray-700 hover:bg-black/5 cursor-pointer text-left px-2 py-1.5"
          >
            {preset.label}
          </button>
        ))}
        <div className="my-1.5 border-t border-gray-200/30" />
        <button
          onClick={() => setRemixTarget(iteration)}
          className="w-full rounded-lg text-[13px] text-gray-500 hover:bg-black/5 cursor-pointer text-left px-2 py-1.5 flex items-center gap-1.5"
        >
          <PenLine className="w-3.5 h-3.5" />
          <span>Custom…</span>
        </button>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

export { REMIX_PRESETS };
