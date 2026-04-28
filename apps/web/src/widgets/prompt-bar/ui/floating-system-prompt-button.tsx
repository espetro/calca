import { useAtom } from "jotai";
import { MessageSquare } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { settingsAtom, updateSettingsAtom } from "#/features/settings/state/settings-atoms";
import { useClickOutside } from "@mantine/hooks";

export function FloatingSystemPromptButton() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [settings] = useAtom(settingsAtom);
  const [, updateSettings] = useAtom(updateSettingsAtom);

  const handleClose = useCallback(() => setIsOpen(false), []);

  useClickOutside(handleClose, null, [panelRef.current, buttonRef.current], isOpen);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSettings({
      systemPrompt: e.target.value,
      systemPromptPreset: "custom",
    });
  };

  const hasCustomPrompt =
    settings.systemPromptPreset === "custom" && settings.systemPrompt.length > 0;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="System Prompt"
        className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${
          isOpen || hasCustomPrompt
            ? "bg-blue-500/90 text-white shadow-lg"
            : "bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-700 hover:bg-white/30 shadow-[0_8px_40px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]"
        }`}
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-[60] w-[320px] max-h-[80vh] overflow-y-auto bg-white/20 backdrop-blur-3xl border border-white/30 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.12),0_4px12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-800">System Prompt</span>
          </div>

          <textarea
            value={settings.systemPrompt}
            onChange={handleChange}
            placeholder='Add custom instructions for the AI designer...&#10;&#10;e.g. "You are a Facebook ad designer. Use 1200x628, minimal text, strong visual hierarchy..."'
            className="w-full h-32 px-4 py-3 rounded-xl bg-white/70 border border-gray-200/50 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-blue-300/50 focus:ring-1 focus:ring-blue-200/30 resize-y font-mono"
          />
          <p className="mt-2 text-[10px] text-gray-500">
            Prepended to every generation. Use for brand guidelines, design skills, or style
            overrides.
          </p>
        </div>
      )}
    </div>
  );
}