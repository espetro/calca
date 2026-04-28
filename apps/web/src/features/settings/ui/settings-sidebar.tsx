import { Info, Palette, Settings, Wrench } from "lucide-react";

import { cn } from "#/lib/utils";
import { Badge } from "#/shared/components/ui/badge";

export type SettingsSection = "general" | "personalization" | "skills" | "about";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  badge?: string;
}[] = [
  { icon: Settings, id: "general", label: "General" },
  { icon: Palette, id: "personalization", label: "Personalization" },
  { badge: "SOON", disabled: true, icon: Wrench, id: "skills", label: "Skills" },
  { icon: Info, id: "about", label: "About" },
];

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <nav className="flex flex-col gap-1 p-3 w-52 shrink-0" aria-label="Settings sections">
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const isDisabled = section.disabled;

        return (
          <button
            key={section.id}
            onClick={() => !isDisabled && onSectionChange(section.id)}
            disabled={isDisabled}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
              isDisabled && "opacity-50 cursor-not-allowed",
              !isDisabled && "hover:bg-accent/50",
              isActive && !isDisabled && "bg-accent text-accent-foreground",
              !isActive && !isDisabled && "text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{section.label}</span>
            {section.badge && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {section.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );
}
