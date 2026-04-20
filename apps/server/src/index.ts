import { Hono } from "hono";
import { cors } from "hono/cors";
import workflowRoute from "./routes/workflow";
import exportRoute from "./routes/export";
import probeModelsRoute from "./routes/probe-models";

const app = new Hono();

app.use("*", cors({ origin: "*" }));

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/workflow", workflowRoute);
app.route("/api/export", exportRoute);
app.route("/api/probe-models", probeModelsRoute);

export default app;

Bun.serve({
  port: 3001,
  fetch: app.fetch,
});

console.log("Server running on http://localhost:3001");
