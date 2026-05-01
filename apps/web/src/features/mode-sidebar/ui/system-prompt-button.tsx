import { useAtom } from "jotai";
import { MessageSquare } from "lucide-react";
import { useCallback, useRef } from "react";

import { settingsAtom, updateSettingsAtom } from "#/features/settings/state/settings-atoms";
import { useClickOutside } from "@mantine/hooks";

import { sidebarDialogAtom } from "../state/dialog-atom";

export function SystemPromptButton() {
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [settings] = useAtom(settingsAtom);
  const [, updateSettings] = useAtom(updateSettingsAtom);
  const [openDialog, setOpenDialog] = useAtom(sidebarDialogAtom);

  const isOpen = openDialog === "system-prompt";

  const handleClose = useCallback(() => setOpenDialog(null), [setOpenDialog]);

  useClickOutside(handleClose, null, [panelRef.current, buttonRef.current], isOpen);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSettings({
      systemPrompt: e.target.value,
      systemPromptPreset: "custom",
    });
  };

  const hasCustomPrompt =
    settings.systemPromptPreset === "custom" && settings.systemPrompt.length > 0;

  const handleToggle = () => {
    setOpenDialog(isOpen ? null : "system-prompt");
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-label="System Prompt"
        className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
          isOpen || hasCustomPrompt
            ? "bg-primary/90 text-white"
            : "text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
        }`}
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-[60] w-[280px] max-h-[calc(100vh-180px)] overflow-y-auto bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-800">System Prompt</span>
          </div>

          <textarea
            value={settings.systemPrompt}
            onChange={handleChange}
            placeholder='Add custom instructions for the AI designer...\n\ne.g. "You are a Facebook ad designer. Use 1200x628, minimal text, strong visual hierarchy..."'
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
