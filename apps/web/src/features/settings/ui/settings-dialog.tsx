import { useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Separator } from "@/shared/components/ui/separator";
import { SettingsSidebar, type SettingsSection } from "./settings-sidebar";
import { SettingsGeneral } from "./settings-general";
import { SettingsPersonalization } from "./settings-personalization";
import { SettingsAbout } from "./settings-about";
import { settingsAtom, updateSettingsAtom } from "../state/settings-atoms";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PlaceholderContent({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p className="text-sm">{title} settings coming soon</p>
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [settings] = useAtom(settingsAtom);
  const updateSettings = useSetAtom(updateSettingsAtom);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl p-0 overflow-hidden gap-0"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Configure your Calca preferences including AI provider, theme, and personalization options.
        </DialogDescription>
        <div className="flex h-[500px]">
          <div className="flex flex-col shrink-0 border-r border-border bg-muted/30">
            <div className="px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Settings</h2>
            </div>
            <Separator />
            <SettingsSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === "general" && (
              <SettingsGeneral
                settings={settings}
                onUpdate={updateSettings}
                onOpenChange={onOpenChange}
              />
            )}
            {activeSection === "personalization" && (
              <SettingsPersonalization
                settings={settings}
                onUpdate={updateSettings}
              />
            )}
            {activeSection === "skills" && <PlaceholderContent title="Skills" />}
            {activeSection === "about" && <SettingsAbout />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
