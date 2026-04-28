import app from "./app";

const IDLE_TIMEOUT_IN_SECONDS = 0;

Bun.serve({
  fetch: app.fetch,
  idleTimeout: IDLE_TIMEOUT_IN_SECONDS,
  port: 3001,
});

console.log("Server running on http://localhost:3001");
