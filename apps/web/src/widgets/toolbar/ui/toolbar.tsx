"use client";

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
    <div className="fixed top-4 right-4 z-50 flex items-center rounded-2xl p-1 bg-gray-900/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] max-w-[calc(100vw-2rem)]">
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

        <div className="w-px h-5 bg-white/15 mx-1" />

        <ToolButton onClick={onZoomOut} title="Zoom out">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </ToolButton>

        <button
          onClick={onResetView}
          className="text-[11px] font-medium text-gray-400 hover:text-white px-1.5 py-1 rounded-lg min-w-[42px] text-center transition-colors"
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

        <div className="w-px h-5 bg-white/15 mx-1" />

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          title="Settings"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOwnKey ? "bg-emerald-400" : "bg-amber-400"}`} />
          <span>{modelLabel}</span>
          <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <div className="w-px h-5 bg-white/15 mx-1" />

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
          <div className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-gray-900/90 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] py-1 overflow-hidden">
            <MenuItem icon="📥" label="Import .otto" onClick={() => { onImport(); setMenuOpen(false); }} />
            {hasFrames && (
              <>
                <MenuItem icon="📤" label="Export .otto" onClick={() => { onExport(); setMenuOpen(false); }} />
                <div className="h-px bg-white/10 my-1" />
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
          ? "text-red-400 hover:bg-red-500/10"
          : "text-gray-300 hover:bg-white/10 hover:text-white"
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
      className="w-8 h-8 flex items-center justify-center rounded-xl transition-all text-gray-400 hover:text-white hover:bg-white/10"
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
    blue: "bg-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)]",
    orange: "bg-orange-500/20 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]",
    yellow: "bg-yellow-500/20 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.4)]",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
        active
          ? activeClasses[color]
          : "text-gray-400 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
