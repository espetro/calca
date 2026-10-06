import type { AppRoutes } from "@app/server";
import { hc } from "hono/client";
import type { ClientResponse } from "hono/client";

import { ensureApiWorker } from "./sw";

export const apiClient = hc<AppRoutes>(import.meta.env.VITE_API_BASE_URL ?? "", {
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    // On the static deployment the /api layer lives in a service worker;
    // wait for it to be active before the first request goes out.
    await ensureApiWorker();
    return fetch(input, init);
  },
});
export type { ClientResponse };
