import { Hono } from "hono";

import { createRateLimiter } from "./rate-limiter.js";
import { validateFeedback } from "./validate.js";
import { postDiscussionComment } from "./github.js";
import type { Env, FeedbackResponse } from "./types.js";

type Bindings = Env;

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use("*", async (c, next) => {
  const allowedOrigin = c.env.ALLOWED_ORIGIN ?? "*";
  c.header("Access-Control-Allow-Origin", allowedOrigin);
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");
  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }
  await next();
});

// GET /health
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// POST /feedback
app.post("/feedback", async (c) => {
  // Extract IP from CF-Connecting-IP header (set automatically by CF) or x-forwarded-for
  const ip =
    (c.req.header("CF-Connecting-IP") ??
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown");

  // Create rate limiter from KV binding
  const limiter = createRateLimiter(c.env.RATE_LIMIT_KV);
  const limitResult = await limiter.check(ip);
  if (!limitResult.allowed) {
    c.header("Retry-After", String(limitResult.retryAfterSeconds));
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const validation = validateFeedback(body);
  if (!validation.ok) {
    return c.json({ error: validation.error }, 400);
  }
  const { data } = validation;

  // Create GitHub issue
    const result = await postDiscussionComment({
    token: c.env.GITHUB_TOKEN,
    repo: c.env.GITHUB_REPO,
    data,
  });

  if (!result.ok) {
    return c.json({ error: result.error }, 500);
  }

  const feedbackResponse: FeedbackResponse = {
    commentUrl: result.commentUrl,
  };
  return c.json(feedbackResponse, 201);
});

// Export as CF Workers module
export default {
  fetch: app.fetch,
};
