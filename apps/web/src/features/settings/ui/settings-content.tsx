import { useAtom, useSetAtom } from "jotai";
import { useState } from "react";

import { Separator } from "#/shared/components/ui/separator";

import { settingsAtom, updateSettingsAtom } from "../state/settings-atoms";
import { SettingsAbout } from "./settings-about";
import { SettingsGeneral } from "./settings-general";
import { SettingsPersonalization } from "./settings-personalization";
import { SettingsReset } from "./settings-reset";
import { SettingsSidebar, type SettingsSection } from "./settings-sidebar";

export interface SettingsContentProps {
  onOpenChange?: (open: boolean) => void;
  defaultSection?: SettingsSection;
}

function PlaceholderContent({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p className="text-sm">{title} settings coming soon</p>
    </div>
  );
}

export function SettingsContent({ onOpenChange, defaultSection }: SettingsContentProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(defaultSection ?? "general");
  const [settings] = useAtom(settingsAtom);
  const updateSettings = useSetAtom(updateSettingsAtom);
  const handleOpenChange = onOpenChange ?? (() => {});

  return (
    <div className="flex h-[500px]">
      <div className="flex flex-col shrink-0 border-r border-border bg-muted/30">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Settings</h2>
        </div>
        <Separator />
        <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {activeSection === "general" && (
          <SettingsGeneral
            settings={settings}
            onUpdate={updateSettings}
            onOpenChange={handleOpenChange}
          />
        )}
        {activeSection === "personalization" && (
          <SettingsPersonalization settings={settings} onUpdate={updateSettings} />
        )}
        {activeSection === "skills" && <PlaceholderContent title="Skills" />}
        {activeSection === "about" && <SettingsAbout />}
        {activeSection === "reset" && <SettingsReset />}
      </div>
    </div>
  );
}
