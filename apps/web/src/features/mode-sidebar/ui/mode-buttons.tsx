import type { ToolMode } from "#/shared/types";

export type { ToolMode };

export interface ModeButtonProps {
  active: boolean;
  title: string;
  children: React.ReactNode;
  color: "select" | "frame" | "component";
  onClick: () => void;
}

const ModeButton = ({ active, title, children, color, onClick }: ModeButtonProps) => {
  const activeStyles = {
    component: {
      background: "var(--tool-component-bg)",
      color: "var(--tool-component-icon)",
      boxShadow: "0 0 12px oklch(0.80 0.10 28.00 / 0.3)",
    },
    frame: {
      background: "var(--tool-frame-bg)",
      color: "var(--tool-frame-icon)",
      boxShadow: "0 0 12px oklch(0.78 0.09 220.00 / 0.3)",
    },
    select: {
      background: "var(--tool-select-bg)",
      color: "var(--tool-select-icon)",
      boxShadow: "0 0 12px var(--glow-primary)",
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
};

interface ModeButtonsProps {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
}

export function ModeButtons({ mode, onModeChange }: ModeButtonsProps) {
  return (
    <div className="flex items-center gap-1">
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
    </div>
  );
}
