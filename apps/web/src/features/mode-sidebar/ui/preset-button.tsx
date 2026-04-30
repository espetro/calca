import { useAtom } from "jotai";
import {
  Layout,
  type LucideIcon,
  Mail,
  Megaphone,
  Palette,
  Presentation,
  Sparkles,
} from "lucide-react";
import { useCallback, useMemo, useRef } from "react";

import { SYSTEM_PROMPT_PRESETS } from "#/features/settings/lib/presets";
import { settingsAtom, updateSettingsAtom } from "#/features/settings/state/settings-atoms";
import { useClickOutside } from "@mantine/hooks";

import { sidebarDialogAtom } from "../state/dialog-atom";

const ICON_MAP: Record<string, LucideIcon> = {
  Layout,
  Mail,
  Megaphone,
  Palette,
  Presentation,
  Sparkles,
};

function getPresetIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Palette;
}

export function PresetButton() {
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [settings] = useAtom(settingsAtom);
  const [, updateSettings] = useAtom(updateSettingsAtom);
  const [openDialog, setOpenDialog] = useAtom(sidebarDialogAtom);

  const isOpen = openDialog === "preset";

  const handleClose = useCallback(() => setOpenDialog(null), [setOpenDialog]);

  useClickOutside(handleClose, null, [panelRef.current, buttonRef.current], isOpen);

  const selectedPreset = useMemo(
    () => SYSTEM_PROMPT_PRESETS.find((p) => p.id === settings.systemPromptPreset),
    [settings.systemPromptPreset],
  );

  const CurrentIcon = getPresetIcon(selectedPreset?.icon || "Palette");

  const handlePresetClick = (presetId: string) => {
    const preset = SYSTEM_PROMPT_PRESETS.find((p) => p.id === presetId);
    if (!preset) {
      return;
    }

    updateSettings({
      systemPrompt: preset.id === "custom" ? "" : preset.prompt,
      systemPromptPreset: preset.id,
    });
  };

  const handleToggle = () => {
    setOpenDialog(isOpen ? null : "preset");
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-label="Designer Preset"
        className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
          isOpen || settings.systemPromptPreset !== "custom"
            ? "bg-chart-1/90 text-white"
            : "text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
        }`}
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-[60] w-[240px] max-h-[calc(100vh-180px)] overflow-y-auto bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] p-4"
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
                      ? "bg-chart-1/90 text-white shadow-sm"
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
