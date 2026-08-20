import { initOTel } from "@app/logger/otel";

import app, { AppRoutes } from "./app";

const IDLE_TIMEOUT_IN_SECONDS = 0; // ! No timeout – we must set per-request timeout

const { shutdown: shutdownOTel } = initOTel({
  serviceName: "calca-server",
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318/v1/traces",
  metricsEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace("/v1/traces", "/v1/metrics")
    : undefined,
  enabled: process.env.OTEL_ENABLED !== "false",
});

process.on("SIGTERM", shutdownOTel);
process.on("SIGINT", shutdownOTel);

Bun.serve({
  fetch: app.fetch,
  idleTimeout: IDLE_TIMEOUT_IN_SECONDS,
  port: 3001,
});

console.log("Server running on http://localhost:3001");

export type { AppRoutes };
