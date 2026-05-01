import { describe, expect, it } from "vitest";

import { validateCritique, validateLayout, validateReview } from "../index";

describe("LayoutSchema", () => {
  it("parses raw HTML with size hint", () => {
    const raw = `<!--size:1200x800-->
<!DOCTYPE html>
<html><body><div>Hello</div></body></html>`;
    const result = validateLayout(raw);
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.width).toBe(1200);
    expect(result.height).toBe(800);
  });

  it("parses markdown-fenced HTML", () => {
    const raw = "```html\n<!DOCTYPE html>\n<html><body><p>Test</p></body></html>\n```";
    const result = validateLayout(raw);
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).not.toContain("```");
  });

  it("parses HTML without size hint", () => {
    const raw = "<html><body><main>Content</main></body></html>";
    const result = validateLayout(raw);
    expect(result.html).toContain("<main>");
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
  });

  it("parses otto comment", () => {
    const raw = "<!--otto:Modern card layout-->\n<div class='card'>Card</div>";
    const result = validateLayout(raw);
    expect(result.comment).toBe("Modern card layout");
  });

  it("rejects empty string", () => {
    expect(() => validateLayout("   ")).toThrow();
  });

  it("rejects non-HTML text", () => {
    expect(() => validateLayout("Just some text without tags")).toThrow();
  });

  it("accepts div-only fragments", () => {
    const raw = "<div class='card'><h2>Title</h2></div>";
    const result = validateLayout(raw);
    expect(result.html).toContain("<div");
  });
});

describe("ReviewSchema", () => {
  it("parses reviewed HTML with size", () => {
    const raw = `<!--size:800x600-->
<div class="fixed-layout">Reviewed content</div>`;
    const result = validateReview(raw);
    expect(result.html).toContain("<div");
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("parses plain HTML without size", () => {
    const raw = "<html><body><p>Fixed content</p></body></html>";
    const result = validateReview(raw);
    expect(result.html).toContain("<p>");
  });
});

describe("CritiqueSchema", () => {
  it("parses plain text critique", () => {
    const result = validateCritique("  The spacing needs improvement.  ");
    expect(result).toBe("The spacing needs improvement.");
  });

  it("rejects empty critique", () => {
    expect(() => validateCritique("   ")).toThrow();
  });

  it("accepts markdown-formatted critique", () => {
    const result = validateCritique("## Issues\n- Too much padding\n- Colors clash");
    expect(result).toContain("## Issues");
  });
});
