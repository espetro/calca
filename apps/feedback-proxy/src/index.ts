import { Hono } from "hono";
import { Octokit } from "octokit";
import { FeedbackRequest, FeedbackResponse } from "./types.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface DailyEntry {
  count: number;
  resetAt: number;
}

const hourlyLimit = 5;
const hourlyWindowMs = 60 * 60 * 1000;
const dailyLimit = 20;
const dailyWindowMs = 24 * 60 * 60 * 1000;

const ipHourlyMap = new Map<string, RateLimitEntry>();
const ipDailyMap = new Map<string, DailyEntry>();

function getOrCreateEntry<T extends { count: number; resetAt: number }>(
  map: Map<string, T>,
  ip: string,
  windowMs: number,
): T {
  const now = Date.now();
  const entry = map.get(ip);
  if (!entry || now > entry.resetAt) {
    const newEntry = { count: 1, resetAt: now + windowMs } as T;
    map.set(ip, newEntry);
    return newEntry;
  }
  entry.count++;
  return entry;
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const hourly = getOrCreateEntry(ipHourlyMap, ip, hourlyWindowMs);
  if (hourly.count > hourlyLimit) {
    const retryAfterSeconds = Math.ceil((hourly.resetAt - Date.now()) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  const daily = getOrCreateEntry(ipDailyMap, ip, dailyWindowMs);
  if (daily.count > dailyLimit) {
    const retryAfterSeconds = Math.ceil((daily.resetAt - Date.now()) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

function validateFeedback(body: unknown): { ok: true; data: FeedbackRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (!["bug", "feature", "feedback"].includes(b.type as string)) {
    return { ok: false, error: "type must be one of: bug, feature, feedback" };
  }

  if (typeof b.title !== "string" || b.title.trim().length === 0) {
    return { ok: false, error: "title is required" };
  }
  if (b.title.length > 200) {
    return { ok: false, error: "title must be at most 200 characters" };
  }

  if (typeof b.description !== "string" || b.description.trim().length === 0) {
    return { ok: false, error: "description is required" };
  }
  if (b.description.length > 5000) {
    return { ok: false, error: "description must be at most 5000 characters" };
  }

  if (b.email !== undefined && (typeof b.email !== "string" || b.email.length > 254)) {
    return { ok: false, error: "email must be a valid string (max 254 chars)" };
  }

  if (b.metadata !== undefined && (typeof b.metadata !== "object" || b.metadata === null || Array.isArray(b.metadata))) {
    return { ok: false, error: "metadata must be a plain object" };
  }

  return {
    ok: true,
    data: {
      type: b.type as FeedbackRequest["type"],
      title: b.title.trim(),
      description: b.description.trim(),
      email: b.email?.trim(),
      metadata: b.metadata as object | undefined,
    },
  };
}

const app = new Hono();

app.use(
  "*",
  async (c, next) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "*";
    c.header("Access-Control-Allow-Origin", allowedOrigin);
    c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type");
    if (c.req.method === "OPTIONS") {
      return c.body(null, 204);
    }
    await next();
  },
);

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/feedback", async (c) => {
  const ip =
    (c.req.header("x-forwarded-for") ?? c.req.header("cf-connecting-ip") ?? "unknown").split(",")[0].trim() ??
    "unknown";
  const limitResult = checkRateLimit(ip);
  if (!limitResult.allowed) {
    c.header("Retry-After", String(limitResult.retryAfterSeconds));
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

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

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("[feedback-proxy] GITHUB_TOKEN is not set");
    return c.json({ error: "Server configuration error" }, 500);
  }

  const repo = process.env.GITHUB_REPO ?? "owner/repo";
  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    console.error("[feedback-proxy] Invalid GITHUB_REPO format:", repo);
    return c.json({ error: "Server configuration error" }, 500);
  }

  const octokit = new Octokit({ auth: token });

  const metadataLines: string[] = [];
  if (data.email) metadataLines.push(`- **Email**: ${data.email}`);
  if (data.metadata) metadataLines.push(`- **Metadata**: ${JSON.stringify(data.metadata, null, 2)}`);
  const metadataSection = metadataLines.length > 0 ? `\n### Metadata\n${metadataLines.join("\n")}\n` : "";

  const bodyMarkdown = [
    `## ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Report`,
    "",
    data.description,
    "",
    `---`,
    `*Submitted via Feedback Proxy*${metadataSection}`,
    "",
    "<!-- powered-by-feedback-proxy -->",
  ].join("\n");

  try {
    const response = await octokit.rest.issues.create({
      owner,
      repo: repoName,
      title: `[${data.type.toUpperCase()}] ${data.title}`,
      body: bodyMarkdown,
      labels: ["user-feedback", data.type],
    });

    const responseData = response.data;
    const feedbackResponse: FeedbackResponse = {
      issueUrl: responseData.html_url,
      issueNumber: responseData.number,
    };

    return c.json(feedbackResponse, 201);
  } catch (err) {
    console.error("[feedback-proxy] GitHub API error:", err);
    return c.json({ error: "Failed to create GitHub issue. Please try again." }, 500);
  }
});

const port = Number(process.env.PORT ?? 3002);
console.log(`[feedback-proxy] Listening on http://localhost:${port}`);

export { app };
export default {
  port,
  fetch: app.fetch,
};
