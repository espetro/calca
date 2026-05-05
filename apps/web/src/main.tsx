import { createLogger } from "@app/logger";
// import { initAnalytics } from "@app/analytics";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { createStore, Provider } from "jotai";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { canvasOffsetAtom, canvasScaleAtom } from "#/features/canvas/state/canvas-atoms";
import { copyFrames, pasteFrames } from "#/features/canvas/lib/frame-clipboard";
import { selectedIdsAtom } from "#/features/design/state/generation-atoms";
import { groupsAtom } from "#/features/design/state/groups-atoms";
import { canvasImagesAtom } from "#/features/design/state/images-atoms";
import { feedbackModalOpenAtom } from "#/features/feedback/store";

import { routeTree } from "./routeTree.gen";

await createLogger(import.meta.env.LOG_LEVEL);
// initAnalytics();

if (!window.__electrobun) {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

const router = createRouter({ routeTree });
const store = createStore();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);

// Desktop menu: Help > "Report a Bug..."
(window as unknown as { __openFeedback: () => void }).__openFeedback = () => {
  store.set(feedbackModalOpenAtom, true);
};

// Desktop context menu: "Duplicate"
(window as unknown as { __duplicate: () => void }).__duplicate = () => {
  const selectedIds = store.get(selectedIdsAtom);
  if (!selectedIds || selectedIds.size === 0) return;

  const groups = store.get(groupsAtom);
  const images = store.get(canvasImagesAtom);
  const offset = store.get(canvasOffsetAtom);
  const scale = store.get(canvasScaleAtom);
  const clipboardData = copyFrames(selectedIds, groups, images);
  if (!clipboardData) return;

  const screenCenterX = window.innerWidth / 2;
  const screenCenterY = window.innerHeight / 2;
  const viewportCenter = {
    x: (screenCenterX - offset.x) / scale + 20,
    y: (screenCenterY - offset.y) / scale + 20,
  };
  const { groups: newGroups, images: newImages } = pasteFrames(clipboardData, viewportCenter);
  store.set(groupsAtom, (prev) => [...prev, ...newGroups]);
  store.set(canvasImagesAtom, (prev) => [...prev, ...newImages]);
  const newIds = new Set<string>();
  for (const g of newGroups) {
    for (const iter of g.iterations) {
      newIds.add(iter.id);
    }
  }
  store.set(selectedIdsAtom, newIds);
};

(window as unknown as { __deleteSelectedFrames: () => void }).__deleteSelectedFrames = () => {
  const selectedIds = store.get(selectedIdsAtom);
  if (!selectedIds || selectedIds.size === 0) return;

  store.set(groupsAtom, (prev) =>
    prev
      .map((g) => ({
        ...g,
        iterations: g.iterations.filter((iter) => !selectedIds.has(iter.id)),
      }))
      .filter((g) => g.iterations.length > 0),
  );
  store.set(canvasImagesAtom, (prev) => prev.filter((img) => !selectedIds.has(img.id)));
  store.set(selectedIdsAtom, new Set());
};
