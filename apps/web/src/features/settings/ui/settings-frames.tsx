import { useSetAtom } from "jotai";
import { Frame } from "lucide-react";

import { m } from "#/lib/i18n";
import { Label } from "#/shared/components/ui/label";
import { Separator } from "#/shared/components/ui/separator";
import { Switch } from "#/shared/components/ui/switch";
import { Textarea } from "#/shared/components/ui/textarea";

import { updateSettingsAtom } from "../state/settings-atoms";
import type { Settings } from "../types";

interface SettingsFramesProps {
  settings: Settings;
}

/**
 * User-configurable frame resources: custom CSS, extra HTML attributes on
 * the frame root, and the animation policy for design frames.
 */
export function SettingsFrames({ settings }: SettingsFramesProps) {
  const updateSettings = useSetAtom(updateSettingsAtom);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {m.settings_framesCssLabel()}
          </Label>
          <p className="text-[11px] text-muted-foreground mt-1">
            {m.settings_framesCssDescription()}
          </p>
        </div>
        <Textarea
          value={settings.customCss ?? ""}
          onChange={(e) => updateSettings({ customCss: e.target.value })}
          placeholder={m.settings_framesCssPlaceholder({})}
          className="font-mono text-xs min-h-[120px]"
          aria-label={m.settings_framesCssLabel()}
        />
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {m.settings_framesAttrsLabel()}
          </Label>
          <p className="text-[11px] text-muted-foreground mt-1">
            {m.settings_framesAttrsDescription()}
          </p>
        </div>
        <Textarea
          value={
            settings.frameAttrs
              ? Object.entries(settings.frameAttrs)
                  .map(([key, value]) => `${key}="${value}"`)
                  .join("\n")
              : ""
          }
          onChange={(e) => {
            const attrs: Record<string, string> = {};
            for (const line of e.target.value.split("\n")) {
              const match = line.match(/^\s*([\w:-]+)\s*=\s*"([^"]*)"\s*$/);
              if (match) attrs[match[1]] = match[2];
            }
            updateSettings({ frameAttrs: Object.keys(attrs).length > 0 ? attrs : undefined });
          }}
          placeholder={m.settings_framesAttrsPlaceholder({
            example: 'data-theme="dark"',
          })}
          className="font-mono text-xs min-h-[80px]"
          aria-label={m.settings_framesAttrsLabel()}
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {m.settings_framesAnimationsLabel()}
          </Label>
          <p className="text-[11px] text-muted-foreground mt-1">
            {m.settings_framesAnimationsDescription()}
          </p>
        </div>
        <Switch
          checked={settings.animationsAllowed}
          onCheckedChange={(checked) => updateSettings({ animationsAllowed: checked })}
          aria-label={m.settings_framesAnimationsLabel()}
        />
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Frame className="size-3.5 shrink-0" aria-hidden="true" />
        <p>{m.settings_framesNote()}</p>
      </div>
    </div>
  );
}
