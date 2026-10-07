import { useClickOutside } from "@mantine/hooks";
import { useAtom } from "jotai";
import { MessageSquare } from "lucide-react";
import { Ref, useCallback, useRef } from "react";

import { Settings } from "#/features/settings";
import { settingsAtom, updateSettingsAtom } from "#/features/settings/state/settings-atoms";
import { Button } from "#/shared/components/ui/button";
import { Textarea } from "#/shared/components/ui/textarea";

import { sidebarDialogAtom } from "../state/dialog-atom";

interface SystemPromptDialogProps extends Pick<Settings, "systemPrompt"> {
  ref: Ref<HTMLDivElement>;
}

const SystemPromptDialog = ({ systemPrompt, ref }: SystemPromptDialogProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const [, updateSettings] = useAtom(updateSettingsAtom);

    updateSettings({
      systemPrompt: e.target.value,
      systemPromptPreset: "custom",
    });
  };

  return (
    <div
      ref={ref}
      className="absolute right-full mr-4 top-1/2 -translate-y-1/2 z-[60] w-[280px] max-h-[calc(100vh-180px)] overflow-y-auto bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl shadow-glass p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">System Prompt</span>
      </div>

      <Textarea
        value={systemPrompt}
        onChange={handleChange}
        placeholder='Add custom instructions for the AI designer...\n\ne.g. "You are a Facebook ad designer. Use 1200x628, minimal text, strong visual hierarchy..."'
        className="w-full h-32 px-4 py-3 rounded-xl bg-card/70 border border-border/50 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-ring/60 focus:ring-1 focus:ring-ring/30 resize-y font-mono"
      />
      <p className="mt-2 text-[10px] text-muted-foreground">
        Prepended to every generation. Use for brand guidelines, design skills, or style overrides.
      </p>
    </div>
  );
};

export function SystemPromptButton() {
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [{ systemPrompt, systemPromptPreset }] = useAtom(settingsAtom);
  const [openDialog, setOpenDialog] = useAtom(sidebarDialogAtom);

  const isOpen = openDialog === "system-prompt";

  const handleClose = useCallback(() => setOpenDialog(null), [setOpenDialog]);

  useClickOutside(handleClose, null, [panelRef.current, buttonRef.current], isOpen);

  const hasCustomPrompt = systemPromptPreset === "custom" && systemPrompt.length > 0;

  const handleToggle = () => {
    setOpenDialog(isOpen ? null : "system-prompt");
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        aria-label="System Prompt"
        className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
          isOpen || hasCustomPrompt
            ? "bg-primary/90 text-primary-foreground"
            : "text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
        }`}
      >
        <MessageSquare className="w-5 h-5" />
      </Button>

      {isOpen && <SystemPromptDialog ref={panelRef} systemPrompt={systemPrompt} />}
    </div>
  );
}
