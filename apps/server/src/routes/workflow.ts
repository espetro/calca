import { handleWorkflowStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "../workflows/mastra";
import { Hono, type Context } from "hono";

export async function handleWorkflow(c: Context) {
  const body = await c.req.json();

  const stream = await handleWorkflowStream({
    mastra,
    workflowId: "designPipeline",
    params: { inputData: body },
    version: "v6",
  });

  return createUIMessageStreamResponse({ stream });
}

const route = new Hono()
  //
  .post("/", handleWorkflow);

export default route;
