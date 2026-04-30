import app, { AppRoutes } from "./app";

const IDLE_TIMEOUT_IN_SECONDS = 0; // ! No timeout – we must set per-request timeout

Bun.serve({
  fetch: app.fetch,
  idleTimeout: IDLE_TIMEOUT_IN_SECONDS,
  port: 3001,
});

console.log("Server running on http://localhost:3001");

export type { AppRoutes };
