import { tokenAggregator } from "@calca/pipeline";
import { type Context, Hono } from "hono";

export const metricsRouter = new Hono();

metricsRouter.get("/", (c: Context) => {
  const u = tokenAggregator.get();
  // Prometheus text format
  const body = [
    `# HELP calca_input_tokens Total input tokens used`,
    `# TYPE calca_input_tokens counter`,
    `calca_input_tokens ${u.inputTokens}`,
    `# HELP calca_output_tokens Total output tokens used`,
    `# TYPE calca_output_tokens counter`,
    `calca_output_tokens ${u.outputTokens}`,
    `# HELP calca_total_tokens Total tokens used`,
    `# TYPE calca_total_tokens counter`,
    `calca_total_tokens ${u.totalTokens}`,
    "",
  ].join("\n");

  return c.text(body, 200, { "Content-Type": "text/plain; charset=utf-8" });
});

export default metricsRouter;
