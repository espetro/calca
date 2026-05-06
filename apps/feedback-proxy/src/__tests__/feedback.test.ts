import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";

const { mockPostDiscussionComment, mockCreateRateLimiter } = vi.hoisted(() => {
  const requestCounts = new Map<string, number>();

  const mockCreateRateLimiter = vi.fn(() => {
    return {
      check: vi.fn(async (ip: string) => {
        const key = `rate:${ip}`;
        const count = requestCounts.get(key) ?? 0;
        requestCounts.set(key, count + 1);

        if (count >= 5) {
          return { allowed: false, retryAfterSeconds: 3600 };
        }
        return { allowed: true };
      }),
    };
  });

  const mockPostDiscussionComment = vi.fn();
  return { mockPostDiscussionComment, mockCreateRateLimiter };
});

vi.mock("../github.js", () => ({
  postDiscussionComment: mockPostDiscussionComment,
}));

vi.mock("../rate-limiter.js", () => ({
  createRateLimiter: mockCreateRateLimiter,
}));

const testEnv = {
  GITHUB_TOKEN: "test-token",
  GITHUB_REPO: "owner/repo",
  ALLOWED_ORIGIN: "*",
  RATE_LIMIT_KV: {} as unknown as KVNamespace,
};

describe("POST /feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPostDiscussionComment.mockReset();
    mockPostDiscussionComment.mockResolvedValue(undefined);
    process.env.GITHUB_TOKEN = "test-token";
    process.env.GITHUB_REPO = "owner/repo";
  });

  it("posts a discussion comment on valid request", async () => {
    mockPostDiscussionComment.mockResolvedValue({
      ok: true,
      commentUrl: "https://github.com/owner/repo/discussions/5#discussioncomment-123",
    });

    const res = await app.request(
      "/feedback",
      {
        method: "POST",
        body: JSON.stringify({
          type: "bug",
          title: "Test bug",
          description: "This is a test bug description",
        }),
        headers: { "content-type": "application/json" },
      },
      testEnv,
    );

    expect(res.status).toBe(201);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json).toEqual({
      commentUrl: "https://github.com/owner/repo/discussions/5#discussioncomment-123",
    });
    expect(mockPostDiscussionComment).toHaveBeenCalledWith({
      token: "test-token",
      repo: "owner/repo",
      data: expect.objectContaining({
        type: "bug",
        title: "Test bug",
        description: "This is a test bug description",
      }),
    });
  });

  it("returns 400 for invalid type", async () => {
    const res = await app.request(
      "/feedback",
      {
        method: "POST",
        body: JSON.stringify({
          type: "invalid-type",
          title: "Test",
          description: "desc",
        }),
        headers: { "content-type": "application/json" },
      },
      testEnv,
    );

    expect(res.status).toBe(400);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toContain("type must be one of");
  });

  it("returns 429 when rate limited", async () => {
    mockPostDiscussionComment.mockResolvedValue({
      ok: true,
      commentUrl: "https://github.com/owner/repo/discussions/5#discussioncomment-1",
    });

    for (let i = 0; i < 5; i++) {
      const res = await app.request(
        "/feedback",
        {
          method: "POST",
          body: JSON.stringify({
            type: "feedback",
            title: `Feedback ${i}`,
            description: `Description ${i}`,
          }),
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "192.168.1.1",
          },
        },
        testEnv,
      );
      expect(res.status).toBe(201);
    }

    const res = await app.request(
      "/feedback",
      {
        method: "POST",
        body: JSON.stringify({
          type: "feedback",
          title: "Rate limited",
          description: "Should be rate limited",
        }),
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "192.168.1.1",
        },
      },
      testEnv,
    );

    expect(res.status).toBe(429);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toContain("Too many requests");
  });

  it("returns 500 when GitHub API call fails", async () => {
    mockPostDiscussionComment.mockResolvedValue({
      ok: false,
      error: "Failed to post discussion comment. Please try again.",
    });

    const res = await app.request(
      "/feedback",
      {
        method: "POST",
        body: JSON.stringify({
          type: "feature",
          title: "Feature request",
          description: "I want this feature",
        }),
        headers: { "content-type": "application/json" },
      },
      testEnv,
    );

    expect(res.status).toBe(500);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toContain("Failed to post discussion comment");
  });

  it("returns 400 for missing required fields", async () => {
    const res = await app.request(
      "/feedback",
      {
        method: "POST",
        body: JSON.stringify({
          type: "bug",
        }),
        headers: { "content-type": "application/json" },
      },
      testEnv,
    );

    expect(res.status).toBe(400);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toBeTruthy();
  });

  it("includes email and metadata in comment body", async () => {
    mockPostDiscussionComment.mockResolvedValue({
      ok: true,
      commentUrl: "https://github.com/owner/repo/discussions/5#discussioncomment-99",
    });

    const res = await app.request(
      "/feedback",
      {
        method: "POST",
        body: JSON.stringify({
          type: "feedback",
          title: "Feedback with extras",
          description: "Description with email and metadata",
          email: "test@example.com",
          metadata: { browser: "Chrome", version: "1.0.0" },
        }),
        headers: { "content-type": "application/json" },
      },
      testEnv,
    );

    expect(res.status).toBe(201);
    expect(mockPostDiscussionComment).toHaveBeenCalledWith({
      token: "test-token",
      repo: "owner/repo",
      data: expect.objectContaining({
        email: "test@example.com",
        metadata: { browser: "Chrome", version: "1.0.0" },
      }),
    });
  });

  it("returns 500 when GITHUB_TOKEN is missing", async () => {
    mockPostDiscussionComment.mockResolvedValue({
      ok: false,
      error: "Server configuration error",
    });

    const res = await app.request(
      "/feedback",
      {
        method: "POST",
        body: JSON.stringify({
          type: "bug",
          title: "Test",
          description: "Test desc",
        }),
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "10.0.0.1",
        },
      },
      { ...testEnv, GITHUB_TOKEN: "" },
    );

    expect(res.status).toBe(500);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toContain("Server configuration error");
  });
});

describe("GET /health", () => {
  it("returns health status", async () => {
    const res = await app.request("/health", undefined, testEnv);

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.status).toBe("ok");
    expect(json.timestamp).toBeTruthy();
  });
});
