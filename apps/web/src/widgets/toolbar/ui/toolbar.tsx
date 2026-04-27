import { useState, useRef, useEffect } from "react";
import type { ToolMode } from "@/shared/types";
import type { ProviderConfig } from "@/features/settings/types";
import { MODELS } from "@/features/settings/types";
import { SettingsDialog } from "@/features/settings/ui/settings-dialog";
import ToolButton from "./tool-button";
import Zoom, { ZoomProps } from "./zoom";

interface ToolbarProps extends ZoomProps {
  mode: ToolMode;
  isOwnKey: boolean;
  model: string;
  providers: ProviderConfig[];
  hasFrames: boolean;
  onExport: () => void;
  onImport: () => void;
  onNewSession: () => void;
  onModeChange: (mode: ToolMode) => void;
}

export function Toolbar({
  mode,
  onModeChange,
  onNewSession,
  onExport,
  onImport,
  isOwnKey,
  model,
  providers,
  hasFrames,
  ...zoomProps
}: ToolbarProps) {
  const [providerId, modelId] = model.includes("/") ? model.split("/") : [null, model];
  const provider = providerId ? providers.find((p) => p.id === providerId) : undefined;
  const displayModel = provider?.models.find((m) => m.id === modelId)?.displayName || modelId;
  const modelLabel =
    MODELS.find((m) => m.id === modelId)?.label || displayModel || model || "Sonnet 4.5";
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      data-tour="toolbar"
      className="fixed top-4 right-4 z-50 flex items-center rounded-2xl p-1 bg-toolbar-bg-transparent border border-border/40 shadow-[0_8px_32px_oklch(0_0_0_/_0.2),inset_0_1px_0_oklch(0_0_0_/_0.08)] max-w-[calc(100vw-2rem)]"
    >
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <ModeButton
          active={mode === "select"}
          onClick={() => onModeChange("select")}
          title="Select (V)"
          color="select"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 3l14 9-7 1-4 7z" fill={mode === "select" ? "currentColor" : "none"} />
          </svg>
        </ModeButton>

        <ModeButton
          active={mode === "draw-area"}
          onClick={() => onModeChange("draw-area")}
          title="Draw Area"
          color="frame"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <path d="M12 3v18" />
            <path d="M3 12h18" />
          </svg>
        </ModeButton>

        <ModeButton
          active={mode === "edit-component"}
          onClick={() => onModeChange("edit-component")}
          title="Edit Component"
          color="component"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.5 1.5a2.121 2.121 0 0 1 3 3L12 8l-4.5 1.5-1.5-4.5 6.5-3.5z" />
            <path d="M5.5 12.5a2.121 2.121 0 0 1 3 3L4 19l-1.5-4.5 3-2z" />
            <path d="M16.5 12.5a2.121 2.121 0 0 0-3 3L18 19l1.5-4.5-3-2z" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </ModeButton>

        <div className="w-px h-5 bg-foreground/15 mx-1" />

        <Zoom {...zoomProps} />

        <div className="w-px h-5 bg-foreground/15 mx-1" />

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
          <svg
            className="w-3.5 h-3.5 opacity-60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <div className="w-px h-5 bg-foreground/15 mx-1" />
      </div>

      <div className="relative shrink-0" ref={menuRef}>
        <ToolButton onClick={() => setMenuOpen(!menuOpen)} title="Menu" dataTour="export-menu">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </ToolButton>

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-foreground/90 backdrop-blur-2xl border border-border/40 shadow-[0_8px_32px_oklch(0_0_0_/_0.3)] py-1 overflow-hidden">
            <MenuItem
              icon="📥"
              label="Import .design"
              onClick={() => {
                onImport();
                setMenuOpen(false);
              }}
            />
            {hasFrames && (
              <>
                <MenuItem
                  icon="📤"
                  label="Export .design"
                  onClick={() => {
                    onExport();
                    setMenuOpen(false);
                  }}
                />
                <div className="h-px bg-foreground/10 my-1" />
                <MenuItem
                  icon="🗑"
                  label="Clear Canvas"
                  onClick={() => {
                    onNewSession();
                    setMenuOpen(false);
                  }}
                  danger
                />
              </>
            )}
          </div>
        )}
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-background/70 hover:bg-background/10 hover:text-background"
      }`}
    >
      <span className="text-sm">{icon}</span>
      {label}
    </button>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  color: "select" | "frame" | "component";
}) {
  const activeStyles = {
    select: {
      background: "var(--tool-select-bg)",
      color: "var(--tool-select-icon)",
      boxShadow: "0 0 12px var(--glow-primary)",
    },
    frame: {
      background: "var(--tool-frame-bg)",
      color: "var(--tool-frame-icon)",
      boxShadow: "0 0 12px oklch(0.78 0.09 220.00 / 0.3)",
    },
    component: {
      background: "var(--tool-component-bg)",
      color: "var(--tool-component-icon)",
      boxShadow: "0 0 12px oklch(0.80 0.10 28.00 / 0.3)",
    },
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
        active ? "" : "text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
      }`}
      style={active ? activeStyles[color] : undefined}
    >
      {children}
    </button>
  );
}
