import { Hono } from "hono";
import { cors } from "hono/cors";
import { getLogger } from "@app/logger";
import workflowRoute from "./routes/workflow";
import exportRoute from "./routes/export";
import probeModelsRoute from "./routes/probe-models";

const app = new Hono()
  .use("*", cors({ origin: "*" }))
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/api/workflow", workflowRoute)
  .route("/api/export", exportRoute)
  .route("/api/probe-models", probeModelsRoute);

Bun.serve({
  port: 3001,
  fetch: app.fetch,
});

getLogger(["calca", "server"]).info("Server running on http://localhost:3001");

export default app;
export type AppRoutes = typeof app;
