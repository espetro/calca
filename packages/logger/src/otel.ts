// Initializes OTel SDK with OTLP HTTP exporter.
// Call once at server startup (apps/server/src/index.ts or similar).
// Returns a shutdown function to flush traces on exit.

import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { Resource } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

export interface OTelConfig {
  serviceName: string;
  serviceVersion?: string;
  otlpEndpoint: string; // e.g. "http://localhost:4318/v1/traces"
  metricsEndpoint?: string; // e.g. "http://localhost:4318/v1/metrics"
  enabled?: boolean;
}

export function initOTel(config: OTelConfig): { shutdown: () => Promise<void> } {
  if (!config.enabled) {
    return { shutdown: async () => {} };
  }

  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: config.serviceVersion ?? "0.0.0",
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({ url: config.otlpEndpoint }),
    metricReader: config.metricsEndpoint
      ? new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({ url: config.metricsEndpoint }),
          exportIntervalMillis: 10_000,
        })
      : undefined,
    instrumentations: [new HttpInstrumentation(), new FetchInstrumentation()],
  });

  sdk.start();
  return {
    shutdown: async () => {
      await sdk.shutdown();
    },
  };
}
