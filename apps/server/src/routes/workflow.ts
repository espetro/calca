import { designPipelineStream } from "@calca/pipeline";
import { type Context, Hono } from "hono";

const KEEP_ALIVE_INTERVAL_MS = 30_000;

/**
 * Wraps a byte stream in a transform that injects SSE keep-alive comments
 * (`:keep-alive\n\n`) at a fixed interval. SSE comments are ignored by
 * parsers but reset HTTP idle timers, keeping long-running pipeline
 * streams alive through proxies and server idle timeouts.
 */
export function withKeepAlive(
  source: ReadableStream<Uint8Array>,
  intervalMs: number = KEEP_ALIVE_INTERVAL_MS,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  const clearIntervalIfPending = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const reader = source.getReader();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      intervalId = setInterval(() => {
        controller.enqueue(encoder.encode(":keep-alive\n\n"));
      }, intervalMs);

      const pump = () => {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              clearIntervalIfPending();
              controller.close();
              return;
            }
            controller.enqueue(value);
            pump();
          })
          .catch((err) => {
            clearIntervalIfPending();
            controller.error(err);
          });
      };
      pump();
    },
    cancel(reason) {
      clearIntervalIfPending();
      return reader.cancel(reason);
    },
  });
}

export async function handleWorkflow(c: Context) {
  const body = await c.req.json();
  const stream = designPipelineStream(body);
  return new Response(withKeepAlive(stream), {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

const route = new Hono().post("/", handleWorkflow);

export default route;
