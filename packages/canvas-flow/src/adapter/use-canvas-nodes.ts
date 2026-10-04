import type { CanvasStore } from "@calca/canvas-base";
import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";

import { projectStore, type CanvasProjection } from "./projection";
import { useCanvasStore } from "./store-context";
import type { CanvasViews } from "./types";

/**
 * Live projection of the document into React Flow nodes/edges. Recomputes
 * when the store emits `change` (or when `views`/`ctx` identity changes).
 * Requires a store: pass one directly or render inside CanvasStoreProvider.
 */
export const useCanvasNodes = <C>(
  views: CanvasViews<C>,
  ctx: C,
  storeOverride?: CanvasStore,
): CanvasProjection => {
  const contextStore = useCanvasStore();
  const store = storeOverride ?? contextStore;
  if (!store) {
    throw new Error("useCanvasNodes requires a CanvasStore (prop or CanvasStoreProvider)");
  }

  const version = useRef(0);
  const subscribe = useCallback(
    (notify: () => void) => {
      const listener = () => {
        version.current += 1;
        notify();
      };
      store.addEventListener("change", listener);
      return () => store.removeEventListener("change", listener);
    },
    [store],
  );
  const v = useSyncExternalStore(subscribe, () => version.current);

  return useMemo(
    () => projectStore(store, views, ctx),
    // v is the projection trigger; store/views/ctx cover the inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, views, ctx, v],
  );
};
