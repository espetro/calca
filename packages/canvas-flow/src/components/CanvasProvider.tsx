import { ReactFlowProvider } from "@xyflow/react";
import type { ReactNode } from "react";

import { CanvasStoreProvider } from "../adapter";

interface CanvasProviderProps {
  children: ReactNode;
}

export function CanvasProvider({ children }: CanvasProviderProps) {
  return (
    <CanvasStoreProvider>
      <ReactFlowProvider>{children}</ReactFlowProvider>
    </CanvasStoreProvider>
  );
}
