"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import {
  Layout,
  Megaphone,
  Sparkles,
  Presentation,
  Mail,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { useAtom } from "jotai";
import { settingsAtom, updateSettingsAtom } from "@/features/settings/state/settings-atoms";
import { SYSTEM_PROMPT_PRESETS } from "@/features/settings/lib/presets";
import { useClickOutside } from "@/shared/hooks/use-click-outside";

const ICON_MAP: Record<string, LucideIcon> = {
  Layout,
  Megaphone,
  Sparkles,
  Presentation,
  Mail,
  Palette,
};

function getPresetIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Palette;
}

export function FloatingPresetButton() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [settings] = useAtom(settingsAtom);
  const [, updateSettings] = useAtom(updateSettingsAtom);

  const handleClose = useCallback(() => setIsOpen(false), []);
  useClickOutside([panelRef, buttonRef], isOpen, handleClose);

  const selectedPreset = useMemo(
    () => SYSTEM_PROMPT_PRESETS.find((p) => p.id === settings.systemPromptPreset),
    [settings.systemPromptPreset]
  );

  const CurrentIcon = getPresetIcon(selectedPreset?.icon || "Palette");

  const handlePresetClick = (presetId: string) => {
    const preset = SYSTEM_PROMPT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    updateSettings({
      systemPromptPreset: preset.id,
      systemPrompt: preset.id === "custom" ? "" : preset.prompt,
    });
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Designer Preset"
        className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${
          isOpen || settings.systemPromptPreset !== "custom"
            ? "bg-amber-500/90 text-white shadow-lg"
            : "bg-white/20 backdrop-blur-3xl border border-white/30 text-gray-700 hover:bg-white/30 shadow-[0_8px_40px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]"
        }`}
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-[60] w-[280px] max-h-[80vh] overflow-y-auto bg-white/20 backdrop-blur-3xl border border-white/30 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <CurrentIcon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-800">Designer Preset</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {SYSTEM_PROMPT_PRESETS.map((preset) => {
              const PresetIcon = getPresetIcon(preset.icon);
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.id)}
                  className={`flex items-center gap-2 text-left text-[12px] font-medium px-3 py-2 rounded-lg transition-all ${
                    settings.systemPromptPreset === preset.id
                      ? "bg-amber-500/90 text-white shadow-sm"
                      : "bg-white/50 text-gray-600 hover:bg-white/80"
                  }`}
                >
                  <PresetIcon className="w-4 h-4 shrink-0" />
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
