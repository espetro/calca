import { handleWorkflowStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { type Context, Hono } from "hono";

import { mastra } from "../workflows/mastra";

export async function handleWorkflow(c: Context) {
  const body = await c.req.json();

  const stream = await handleWorkflowStream({
    mastra,
    params: { inputData: body },
    version: "v6",
    workflowId: "designPipeline",
  });

  return createUIMessageStreamResponse({ stream });
}

const route = new Hono()
  //
  .post("/", handleWorkflow);

export default route;
