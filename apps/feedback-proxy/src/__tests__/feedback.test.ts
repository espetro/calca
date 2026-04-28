import { beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../index.js";

const mockOctokitInstance = {
  rest: {
    issues: {
      create: vi.fn(),
    },
  },
};

vi.mock("octokit", () => ({
  Octokit: vi.fn(function () {
    return mockOctokitInstance;
  }),
}));

describe("POST /feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = "test-token";
    process.env.GITHUB_REPO = "owner/repo";
  });

  it("creates a GitHub Issue on valid request", async () => {
    mockOctokitInstance.rest.issues.create.mockResolvedValue({
      data: { number: 42, html_url: "https://github.com/owner/repo/issues/42" },
    } as any);

    const res = await app.request("/feedback", {
      method: "POST",
      body: JSON.stringify({
        type: "bug",
        title: "Test bug",
        description: "This is a test bug description",
      }),
      headers: { "content-type": "application/json" },
    });

    expect(res.status).toBe(201);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json).toEqual({
      issueUrl: "https://github.com/owner/repo/issues/42",
      issueNumber: 42,
    });
    expect(mockOctokitInstance.rest.issues.create).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      title: "[BUG] Test bug",
      body: expect.stringContaining("Bug Report"),
      labels: ["user-feedback", "bug"],
    });
  });

  it("returns 400 for invalid type", async () => {
    const res = await app.request("/feedback", {
      method: "POST",
      body: JSON.stringify({
        type: "invalid-type",
        title: "Test",
        description: "desc",
      }),
      headers: { "content-type": "application/json" },
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toContain("type must be one of");
  });

  it("returns 429 when rate limited", async () => {
    mockOctokitInstance.rest.issues.create.mockResolvedValue({
      data: { number: 1, html_url: "https://github.com/owner/repo/issues/1" },
    } as any);

    for (let i = 0; i < 5; i++) {
      await app.request("/feedback", {
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
      });
    }

    const res = await app.request("/feedback", {
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
    });

    expect(res.status).toBe(429);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toContain("Too many requests");
  });

  it("returns 500 when GitHub API call fails", async () => {
    mockOctokitInstance.rest.issues.create.mockRejectedValue(new Error("API Error"));

    const res = await app.request("/feedback", {
      method: "POST",
      body: JSON.stringify({
        type: "feature",
        title: "Feature request",
        description: "I want this feature",
      }),
      headers: { "content-type": "application/json" },
    });

    expect(res.status).toBe(500);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toContain("Failed to create GitHub issue");
  });

  it("returns 400 for missing required fields", async () => {
    const res = await app.request("/feedback", {
      method: "POST",
      body: JSON.stringify({
        type: "bug",
      }),
      headers: { "content-type": "application/json" },
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toBeTruthy();
  });

  it("includes email and metadata in issue body", async () => {
    mockOctokitInstance.rest.issues.create.mockResolvedValue({
      data: { number: 99, html_url: "https://github.com/owner/repo/issues/99" },
    } as any);

    const res = await app.request("/feedback", {
      method: "POST",
      body: JSON.stringify({
        type: "feedback",
        title: "Feedback with extras",
        description: "Description with email and metadata",
        email: "test@example.com",
        metadata: { browser: "Chrome", version: "1.0.0" },
      }),
      headers: { "content-type": "application/json" },
    });

    expect(res.status).toBe(201);
    expect(mockOctokitInstance.rest.issues.create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining("test@example.com"),
      }),
    );
  });

  it("returns 500 when GITHUB_TOKEN is missing", async () => {
    delete process.env.GITHUB_TOKEN;

    const res = await app.request("/feedback", {
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
    });

    expect(res.status).toBe(500);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.error).toContain("Server configuration error");
  });
});

describe("GET /health", () => {
  it("returns health status", async () => {
    const res = await app.request("/health");

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.status).toBe("ok");
    expect(json.timestamp).toBeTruthy();
  });
});
