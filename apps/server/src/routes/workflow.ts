import { designPipelineStream } from "@calca/pipeline";
import { type Context, Hono } from "hono";

export async function handleWorkflow(c: Context) {
  const body = await c.req.json();
  const stream = designPipelineStream(body);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

const route = new Hono().post("/", handleWorkflow);

export default route;
