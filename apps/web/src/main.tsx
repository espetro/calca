import { createLogger } from "@app/logger";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { routeTree } from "./routeTree.gen";
import { showFeedbackAtom } from "@/features/feedback/state/feedback-atoms";

await createLogger();

document.addEventListener("contextmenu", (e) => e.preventDefault());

const router = createRouter({ routeTree });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

// Desktop menu: Help > "Report a Bug..."
(window as unknown as { __openFeedback: () => void }).__openFeedback = () => {
  showFeedbackAtom.set(true);
};
