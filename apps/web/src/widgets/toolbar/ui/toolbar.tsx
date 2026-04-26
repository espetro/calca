import { useState, useRef, useEffect } from "react";
import type { ToolMode } from "@/shared/types";
import type { ProviderConfig } from "@/features/settings/types";
import { MODELS } from "@/features/settings/hooks/use-settings";

interface ToolbarProps {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onOpenSettings: () => void;
  onNewSession: () => void;
  onExport: () => void;
  onImport: () => void;
  isOwnKey: boolean;
  model: string;
  providers: ProviderConfig[];
  hasFrames: boolean;
}

export function Toolbar({
  mode,
  onModeChange,
  scale,
  onZoomIn,
  onZoomOut,
  onResetView,
  onOpenSettings,
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
  const modelLabel = MODELS.find((m) => m.id === modelId)?.label || displayModel || model || "Sonnet 4.5";
  const [menuOpen, setMenuOpen] = useState(false);
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
    <div className="fixed top-4 right-4 z-50 flex items-center rounded-2xl p-1 bg-foreground/60 backdrop-blur-2xl border border-border/40 shadow-[0_8px_32px_oklch(0_0_0_/_0.2),inset_0_1px_0_oklch(0_0_0_/_0.08)] max-w-[calc(100vw-2rem)]">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <ModeButton
          active={mode === "select"}
          onClick={() => onModeChange("select")}
          title="Select (V)"
          color="blue"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3l14 9-7 1-4 7z" fill={mode === "select" ? "currentColor" : "none"} />
          </svg>
        </ModeButton>

        <ModeButton
          active={mode === "draw-area"}
          onClick={() => onModeChange("draw-area")}
          title="Draw Area"
          color="orange"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <path d="M12 3v18" />
            <path d="M3 12h18" />
          </svg>
        </ModeButton>

        <ModeButton
          active={mode === "edit-component"}
          onClick={() => onModeChange("edit-component")}
          title="Edit Component"
          color="yellow"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.5 1.5a2.121 2.121 0 0 1 3 3L12 8l-4.5 1.5-1.5-4.5 6.5-3.5z" />
            <path d="M5.5 12.5a2.121 2.121 0 0 1 3 3L4 19l-1.5-4.5 3-2z" />
            <path d="M16.5 12.5a2.121 2.121 0 0 0-3 3L18 19l1.5-4.5-3-2z" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </ModeButton>

        <div className="w-px h-5 bg-foreground/15 mx-1" />

        <ToolButton onClick={onZoomOut} title="Zoom out">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </ToolButton>

        <button
          onClick={onResetView}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-1.5 py-1 rounded-lg min-w-[42px] text-center transition-colors"
          title="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>

        <ToolButton onClick={onZoomIn} title="Zoom in">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </ToolButton>

        <div className="w-px h-5 bg-foreground/15 mx-1" />

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all"
          title="Settings"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOwnKey ? "bg-emerald-400" : "bg-amber-400"}`} />
          <span>{modelLabel}</span>
          <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <div className="w-px h-5 bg-foreground/15 mx-1" />

      </div>

      <div className="relative shrink-0" ref={menuRef}>
        <ToolButton onClick={() => setMenuOpen(!menuOpen)} title="Menu" dataTour="export-menu">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </ToolButton>

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-foreground/90 backdrop-blur-2xl border border-border/40 shadow-[0_8px_32px_oklch(0_0_0_/_0.3)] py-1 overflow-hidden">
            <MenuItem icon="📥" label="Import .design" onClick={() => { onImport(); setMenuOpen(false); }} />
            {hasFrames && (
              <>
                <MenuItem icon="📤" label="Export .design" onClick={() => { onExport(); setMenuOpen(false); }} />
                <div className="h-px bg-foreground/10 my-1" />
                <MenuItem icon="🗑" label="Clear Canvas" onClick={() => { onNewSession(); setMenuOpen(false); }} danger />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
      }`}
    >
      <span className="text-sm">{icon}</span>
      {label}
    </button>
  );
}

function ToolButton({
  onClick,
  title,
  children,
  dataTour,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  dataTour?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      data-tour={dataTour}
      className="w-8 h-8 flex items-center justify-center rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-foreground/10"
    >
      {children}
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
  color: "blue" | "orange" | "yellow";
}) {
  const activeClasses = {
    blue: "bg-primary/20 text-primary shadow-[0_0_12px_oklch(0.44_0.0472_158.31_/_0.4)]",
    orange: "bg-accent/20 text-accent shadow-[0_0_12px_oklch(0.77_0.0749_131.06_/_0.4)]",
    yellow: "bg-secondary/20 text-secondary shadow-[0_0_12px_oklch(0.66_0.0552_153.35_/_0.4)]",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
        active
          ? activeClasses[color]
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
      }`}
    >
      {children}
    </button>
  );
}
