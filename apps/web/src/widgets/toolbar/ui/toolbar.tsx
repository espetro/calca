import { Menu, Settings } from "lucide-react";
import { useState } from "react";

import type { ProviderConfig } from "#/features/settings/types";
import { MODELS } from "#/features/settings/types";
import { SettingsDialog } from "#/features/settings/ui/settings-dialog";
import { Button } from "#/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/shared/components/ui/dropdown-menu";
import { Separator } from "#/shared/components/ui/separator";

interface ToolbarProps {
  isOwnKey: boolean;
  model: string;
  providers: ProviderConfig[];
  hasFrames: boolean;
  onExport: () => void;
  onImport: () => void;
  onNewSession: () => void;
}

export function Toolbar({
  onNewSession,
  onExport,
  onImport,
  isOwnKey,
  model,
  providers,
  hasFrames,
}: ToolbarProps) {
  const [providerId, modelId] = model.includes("/") ? model.split("/") : [null, model];
  const provider = providerId ? providers.find((p) => p.id === providerId) : undefined;
  const displayModel = provider?.models.find((m) => m.id === modelId)?.displayName || modelId;
  const modelLabel =
    MODELS.find((m) => m.id === modelId)?.label || displayModel || model || "Sonnet 4.5";
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      data-tour="toolbar"
      className="fixed top-4 right-4 z-50 flex items-center rounded-2xl p-1 bg-toolbar-bg-transparent border border-border/40 shadow-[0_8px_32px_oklch(0_0_0_/_0.2),inset_0_1px_0_oklch(0_0_0_/_0.08)] max-w-[calc(100vw-2rem)]"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setSettingsOpen(true)}
          data-tour="toolbar-settings"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10 transition-all"
          title="Settings"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isOwnKey ? "bg-emerald-400" : "bg-amber-400"}`}
          />
          <span>{modelLabel}</span>
          <Settings className="w-3.5 h-3.5 opacity-60" />
        </button>

        <Separator orientation="vertical" className="h-5 mx-1" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-xl text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
            data-tour="export-menu"
            title="Menu"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 rounded-xl bg-foreground/90 backdrop-blur-2xl border border-border/40 shadow-[0_8px_32px_oklch(0_0_0_/_0.3)]"
        >
          <DropdownMenuItem
            onClick={onImport}
            className="text-background/70 hover:bg-background/10 hover:text-background text-[12px] focus:bg-background/10 focus:text-background"
          >
            <span className="text-sm">📥</span>
            Import .design
          </DropdownMenuItem>
          {hasFrames && (
            <>
              <DropdownMenuItem
                onClick={onExport}
                className="text-background/70 hover:bg-background/10 hover:text-background text-[12px] focus:bg-background/10 focus:text-background"
              >
                <span className="text-sm">📤</span>
                Export .design
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-foreground/10" />
              <DropdownMenuItem
                onClick={onNewSession}
                className="text-destructive hover:bg-destructive/10 text-[12px] focus:bg-destructive/10 focus:text-destructive"
              >
                <span className="text-sm">🗑</span>
                Clear Canvas
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
