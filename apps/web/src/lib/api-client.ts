import type { AppRoutes } from "@app/server";
import { hc } from "hono/client";
import type { ClientResponse } from "hono/client";

export const apiClient = hc<AppRoutes>(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001");
export type { ClientResponse };
