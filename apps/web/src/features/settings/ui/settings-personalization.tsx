import { Sun, Moon, Monitor, Palette, Type } from "lucide-react";
import type { Settings, Theme } from "../types";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
  { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> },
];

interface SettingsPersonalizationProps {
  settings: Settings;
  onUpdate: (update: Partial<Settings>) => void;
}

export function SettingsPersonalization({ settings, onUpdate }: SettingsPersonalizationProps) {

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
          Theme
        </h3>
        <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ theme: option.value })}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                settings.theme === option.value
                  ? "bg-white text-gray-800 shadow-sm border border-gray-200/60"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
          Appearance
        </h3>

        <div className="flex items-center justify-between opacity-50">
          <div className="flex items-center gap-3">
            <Palette className="w-4 h-4 text-gray-400" />
            <div>
              <Label className="text-[13px] text-gray-700">Custom accent color</Label>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Choose your preferred accent color
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Coming soon
            </span>
            <Switch disabled />
          </div>
        </div>

        <div className="flex items-center justify-between opacity-50">
          <div className="flex items-center gap-3">
            <Type className="w-4 h-4 text-gray-400" />
            <div>
              <Label className="text-[13px] text-gray-700">Font size</Label>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Adjust the interface font size
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Coming soon
            </span>
            <Switch disabled />
          </div>
        </div>
      </div>
    </div>
  );
}
