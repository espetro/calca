import { QueryClient } from "@tanstack/react-query";
// import { hc } from "hono/client";
// import type { AppRoutes } from "@app/server";

const FIVE_HOURS_IN_MS = 1000 * 60 * 5;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_HOURS_IN_MS,
      // throwOnError
    },
  },
});

/** @deprecated use {@link apiClient} */
export const legacyApiClient = async <T extends object>(path: string, init?: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
};

// export const apiClient = hc<AppRoutes>(API_BASE_URL);

export default queryClient;
