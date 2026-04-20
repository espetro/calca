import { handleWorkflowStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "../workflows/mastra";
import { Hono } from "hono";

const route = new Hono()
  //
  .post("/", async (c) => {
    const body = await c.req.json();

    const stream = await handleWorkflowStream({
      mastra,
      workflowId: "designPipeline",
      params: { inputData: body },
      version: "v6",
    });

    return createUIMessageStreamResponse({ stream });
  });

export default route;
