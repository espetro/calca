import { Globe, Monitor, Moon, Palette, Sun, Type } from "lucide-react";

import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Switch } from "@/shared/components/ui/switch";

import type { Settings, Theme } from "../types";

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { icon: <Sun className="w-4 h-4" />, label: "Light", value: "light" },
  { icon: <Moon className="w-4 h-4" />, label: "Dark", value: "dark" },
  { icon: <Monitor className="w-4 h-4" />, label: "System", value: "system" },
];

interface SettingsPersonalizationProps {
  settings: Settings;
  onUpdate: (update: Partial<Settings>) => void;
}

export function SettingsPersonalization({ settings, onUpdate }: SettingsPersonalizationProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
          Theme
        </h3>
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ theme: option.value })}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                settings.theme === option.value
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between opacity-50">
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <div>
            <Label className="text-[13px] text-foreground">Language</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Choose your preferred language
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Coming soon
          </span>
          <Select disabled value="en">
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="English" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
          Appearance
        </h3>

        <div className="flex items-center justify-between opacity-50">
          <div className="flex items-center gap-3">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <div>
              <Label className="text-[13px] text-foreground">Custom accent color</Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Choose your preferred accent color
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Coming soon
            </span>
            <Switch disabled />
          </div>
        </div>

        <div className="flex items-center justify-between opacity-50">
          <div className="flex items-center gap-3">
            <Type className="w-4 h-4 text-muted-foreground" />
            <div>
              <Label className="text-[13px] text-foreground">Font size</Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Adjust the interface font size
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Coming soon
            </span>
            <Switch disabled />
          </div>
        </div>
      </div>
    </div>
  );
}
