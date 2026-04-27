import { QueryClient } from "@tanstack/react-query";

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

export default queryClient;
