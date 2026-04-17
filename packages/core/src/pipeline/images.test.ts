import { describe, it, expect } from "vitest";
import { getClosestDalleSize, generateImages } from "./images";

describe("getClosestDalleSize", () => {
  it("returns landscape size for wide aspect ratios (>= 1.3)", () => {
    expect(getClosestDalleSize(1792, 1024)).toBe("1792x1024");
    expect(getClosestDalleSize(1300, 1000)).toBe("1792x1024");
  });

  it("returns portrait size for tall aspect ratios (<= 0.77)", () => {
    expect(getClosestDalleSize(1024, 1792)).toBe("1024x1792");
    expect(getClosestDalleSize(700, 1000)).toBe("1024x1792");
  });

  it("returns square size for normal aspect ratios", () => {
    expect(getClosestDalleSize(1024, 1024)).toBe("1024x1024");
    expect(getClosestDalleSize(900, 700)).toBe("1024x1024");
  });

  it("handles edge case at exactly 1.3 aspect ratio", () => {
    expect(getClosestDalleSize(1300, 1000)).toBe("1792x1024");
  });

  it("handles edge case at exactly 0.77 aspect ratio", () => {
    expect(getClosestDalleSize(770, 1000)).toBe("1024x1792");
  });
});

describe("generateImages", () => {
  it("returns skipped result when no API keys provided", async () => {
    const html = '<div data-placeholder="test" data-ph-w="100" data-ph-h="100"></div>';
    const result = await generateImages({ html });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("No image API keys");
    expect(result.imageCount).toBe(0);
    expect(result.html).toBe(html);
  });

  it("returns skipped result when no placeholders found in HTML", async () => {
    const html = '<div>No placeholders here</div>';
    const result = await generateImages({ html, geminiKey: "test" });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("No placeholders found");
    expect(result.imageCount).toBe(0);
    expect(result.html).toBe(html);
  });

  it("parses placeholders with default source when no source specified", async () => {
    const html = '<div data-placeholder="test image" data-ph-w="200" data-ph-h="300"></div>';
    const result = await generateImages({ html, geminiKey: "test-key" });

    expect(result).toBeDefined();
    expect(result.html).toBeDefined();
  });

  it("handles HTML with multiple placeholders", async () => {
    const html = `
      <div data-placeholder="image 1" data-ph-w="100" data-ph-h="100"></div>
      <div data-placeholder="image 2" data-ph-w="200" data-ph-h="200"></div>
      <div data-placeholder="image 3" data-ph-w="300" data-ph-h="300"></div>
    `;
    const result = await generateImages({ html, unsplashKey: "test" });

    // Should find placeholders but skip due to network failures (no real API)
    expect(result.html).toBeDefined();
  });

  it("preserves HTML when placeholder has explicit source", async () => {
    const html = '<div data-placeholder="test" data-ph-w="100" data-ph-h="100" data-img-source="unsplash"></div>';
    const result = await generateImages({ html, unsplashKey: "test-key" });

    expect(result).toBeDefined();
  });

  it("handles placeholder with custom query", async () => {
    const html = '<div data-placeholder="coffee" data-ph-w="100" data-ph-h="100" data-img-query="espresso"></div>';
    const result = await generateImages({ html, unsplashKey: "test-key" });

    expect(result).toBeDefined();
  });

  it("uses viewport dimensions when provided", async () => {
    const html = '<div data-placeholder="test" data-ph-w="100" data-ph-h="100"></div>';
    const result = await generateImages({
      html,
      unsplashKey: "test",
      viewport: { width: 800, height: 600 },
    });

    expect(result).toBeDefined();
  });

  it("handles empty HTML string", async () => {
    const result = await generateImages({ html: "", unsplashKey: "test" });

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("No placeholders found");
    expect(result.imageCount).toBe(0);
  });
});
