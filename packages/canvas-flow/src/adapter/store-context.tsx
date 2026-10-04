import { createCanvasStore, type CanvasStore } from "@calca/canvas-base";
import { createContext, useContext, useState, type ReactNode } from "react";

const CanvasStoreContext = createContext<CanvasStore | null>(null);

interface CanvasStoreProviderProps {
  store?: CanvasStore;
  children: ReactNode;
}

export const CanvasStoreProvider = ({ store, children }: CanvasStoreProviderProps) => {
  const [owned] = useState(() => store ?? createCanvasStore());
  return <CanvasStoreContext.Provider value={owned}>{children}</CanvasStoreContext.Provider>;
};

/** The store scoped to the nearest provider, or null outside one. */
export const useCanvasStore = () => useContext(CanvasStoreContext);
