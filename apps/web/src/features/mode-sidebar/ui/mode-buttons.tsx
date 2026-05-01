import { PropsWithChildren } from "react";

export type ModeType = "select" | "frame" | "component";

export interface ModeButtonProps extends PropsWithChildren {
  active: boolean;
  title: string;
  color: ModeType;
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

export default ModeButton;
