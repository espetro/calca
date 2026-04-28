import { createLogger, getLogger } from "@app/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";

import exportRoute from "./routes/export";
import probeModelsRoute from "./routes/probe-models";
import workflowRoute from "./routes/workflow";

await createLogger({ env: process.env });

const logger = getLogger(["calca", "server"]);

const app = new Hono()
  .use("*", cors({ origin: "*" }))
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/api/workflow", workflowRoute)
  .route("/api/export", exportRoute)
  .route("/api/probe-models", probeModelsRoute);

logger.info("Server app initialized");

export default app;
export type AppRoutes = typeof app;
