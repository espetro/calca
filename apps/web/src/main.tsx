import { createLogger } from "@app/logger";
// import { initAnalytics } from "@app/analytics";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { createStore, Provider } from "jotai";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { feedbackModalOpenAtom } from "#/features/feedback/store";

import { routeTree } from "./routeTree.gen";

await createLogger(import.meta.env.LOG_LEVEL);
// initAnalytics();

document.addEventListener("contextmenu", (e) => e.preventDefault());

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
