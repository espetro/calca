import type { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  title: string;
  dataTour?: string;
  onClick: () => void;
}

const ToolButton = ({ onClick, title, children, dataTour }: Props) => (
  <button
    onClick={onClick}
    title={title}
    data-tour={dataTour}
    className="w-8 h-8 flex items-center justify-center rounded-xl transition-all text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
  >
    {children}
  </button>
);

export default ToolButton;
