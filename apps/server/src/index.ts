import { Hono } from "hono";
import { cors } from "hono/cors";
import { createLogger, getLogger } from "@app/logger";
import workflowRoute from "./routes/workflow";
import exportRoute from "./routes/export";
import probeModelsRoute from "./routes/probe-models";

await createLogger();

const IDLE_TIMEOUT_IN_SECONDS = 255; // ? Max allowed by bun (4,25 minutes)

const logger = getLogger(["calca", "server"]);

const app = new Hono()
  .use("*", cors({ origin: "*" }))
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/api/workflow", workflowRoute)
  .route("/api/export", exportRoute)
  .route("/api/probe-models", probeModelsRoute);

Bun.serve({
  port: 3001,
  idleTimeout: IDLE_TIMEOUT_IN_SECONDS,
  fetch: app.fetch,
});

logger.info("Server running on http://localhost:3001");

export default app;
export type AppRoutes = typeof app;
