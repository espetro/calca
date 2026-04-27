import { createLogger } from "@app/logger";
import { initAnalytics } from "@app/analytics";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { createStore } from "jotai";

import { routeTree } from "./routeTree.gen";
import { feedbackModalOpenAtom } from "@/features/feedback/store";

await createLogger();
initAnalytics();

document.addEventListener("contextmenu", (e) => e.preventDefault());

const router = createRouter({ routeTree });
const store = createStore();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

// Desktop menu: Help > "Report a Bug..."
(window as unknown as { __openFeedback: () => void }).__openFeedback = () => {
  store.set(feedbackModalOpenAtom, true);
};
