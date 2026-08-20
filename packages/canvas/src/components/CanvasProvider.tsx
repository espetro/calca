import { ReactFlowProvider } from "@xyflow/react";
import type { ReactNode } from "react";

interface CanvasProviderProps {
  children: ReactNode;
}

export function CanvasProvider({ children }: CanvasProviderProps) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}
