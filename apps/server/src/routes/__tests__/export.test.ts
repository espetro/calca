import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Context } from "hono";

vi.mock("@app/core/ai/client", () => ({
  generateWithFallback: vi.fn(),
}));

vi.mock("../../lib/html-to-svg", () => ({
  htmlToSvg: vi.fn((html: string) => `<svg>${html}</svg>`),
}));

import { generateWithFallback } from "@app/core/ai/client";
import { htmlToSvg } from "../../lib/html-to-svg";
import { handleExport } from "../export";

function createMockContext(body: unknown): Context {
  const json = vi.fn((data, status) => ({
    status: status ?? 200,
    json: data,
  }));
  return {
    req: {
      json: vi.fn().mockResolvedValue(body),
    },
    json,
  } as unknown as Context;
}

describe("handleExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("svg format", () => {
    it("converts html to svg", async () => {
      const ctx = createMockContext({
        html: '<div width="100px">hello</div>',
        format: "svg",
      });

      await handleExport(ctx);

      expect(htmlToSvg).toHaveBeenCalledOnce();
      expect(ctx.json).toHaveBeenCalledWith({
        result: '<svg><div width="100px">hello</div></svg>',
      });
    });
  });

  describe("tailwind format", () => {
    it("uses AI to convert html to tailwind", async () => {
      (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
        result: { text: '<div class="bg-blue-500">hello</div>' },
      } as Awaited<ReturnType<typeof generateWithFallback>>);

      const ctx = createMockContext({
        html: '<div style="background: blue">hello</div>',
        format: "tailwind",
        apiKey: "sk-test",
      });

      await handleExport(ctx);

      expect(generateWithFallback).toHaveBeenCalledOnce();
      expect(ctx.json).toHaveBeenCalledWith({ result: expect.stringContaining("bg-blue-500") });
    });
  });

  describe("react format", () => {
    it("uses AI to convert html to react component", async () => {
      (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
        result: { text: "export default function Design() { return <div /> }" },
      } as Awaited<ReturnType<typeof generateWithFallback>>);

      const ctx = createMockContext({
        html: "<div>hello</div>",
        format: "react",
        apiKey: "sk-test",
        model: "claude-sonnet-4-20250514",
      });

      await handleExport(ctx);

      expect(generateWithFallback).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-sonnet-4-20250514",
        }),
      );
      expect(ctx.json).toHaveBeenCalledWith({ result: expect.stringContaining("Design") });
    });
  });

  describe("validation", () => {
    it("returns 400 when html is missing", async () => {
      const ctx = createMockContext({ format: "svg" });

      await handleExport(ctx);

      expect(ctx.json).toHaveBeenCalledWith({ error: "html and format required" }, 400);
    });

    it("returns 400 when format is missing", async () => {
      const ctx = createMockContext({ html: "<div>hello</div>" });

      await handleExport(ctx);

      expect(ctx.json).toHaveBeenCalledWith({ error: "html and format required" }, 400);
    });

    it("returns 400 for invalid format", async () => {
      const ctx = createMockContext({ html: "<div>hello</div>", format: "pdf" });

      await handleExport(ctx);

      expect(ctx.json).toHaveBeenCalledWith({ error: "Invalid format" }, 400);
    });
  });

  describe("error handling", () => {
    it("returns 500 on general error", async () => {
      (generateWithFallback as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("something broke"),
      );

      const ctx = createMockContext({
        html: "<div>hello</div>",
        format: "tailwind",
        apiKey: "sk-test",
      });

      await handleExport(ctx);

      expect(ctx.json).toHaveBeenCalledWith({ error: "something broke" }, 500);
    });

    it("returns 401 on auth error", async () => {
      (generateWithFallback as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Invalid API key provided"),
      );

      const ctx = createMockContext({
        html: "<div>hello</div>",
        format: "react",
        apiKey: "bad-key",
      });

      await handleExport(ctx);

      expect(ctx.json).toHaveBeenCalledWith({ error: "Invalid API key provided" }, 401);
    });
  });

  describe("strips base64 images", () => {
    it("replaces base64 src with [image] placeholder before AI conversion", async () => {
      (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
        result: { text: "<div>ok</div>" },
      } as Awaited<ReturnType<typeof generateWithFallback>>);

      const ctx = createMockContext({
        html: '<img src="data:image/png;base64,iVBOR..." />',
        format: "tailwind",
        apiKey: "sk-test",
      });

      await handleExport(ctx);

      expect(generateWithFallback).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.not.stringContaining("base64"),
            }),
          ]),
        }),
      );
    });
  });

  describe("uses default model when none provided", () => {
    it("falls back to claude-sonnet-4-20250514", async () => {
      (generateWithFallback as ReturnType<typeof vi.fn>).mockResolvedValue({
        result: { text: "<div>ok</div>" },
      } as Awaited<ReturnType<typeof generateWithFallback>>);

      const ctx = createMockContext({
        html: "<div>hello</div>",
        format: "tailwind",
        apiKey: "sk-test",
      });

      await handleExport(ctx);

      expect(generateWithFallback).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-sonnet-4-20250514",
        }),
      );
    });
  });
});
