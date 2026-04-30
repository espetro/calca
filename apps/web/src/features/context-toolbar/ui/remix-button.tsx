import { useEffect, useRef, useState } from "react";

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
  const menuRef = useRef<HTMLDivElement>(null);

  // oxlint-disable-next-line
  useEffect(() => {
    if (!open) {
      return;
    }
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleRemix = (prompt: string) => {
    setOpen(false);
    setCustomPrompt("");
    onRemix(iteration, prompt);
  };

  return (
    <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-all"
        title="Remix this design"
        data-tour="remix-button"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        Remix
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white/70 backdrop-blur-2xl rounded-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] p-1.5 min-w-[260px] z-30">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Quick remix
          </div>
          {REMIX_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleRemix(preset.prompt)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-gray-700 hover:bg-black/5 transition-colors text-left"
            >
              {preset.label}
            </button>
          ))}
          <div className="my-1.5 border-t border-gray-200/30" />
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
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
        </div>
      )}
    </div>
  );
}

export { REMIX_PRESETS };
