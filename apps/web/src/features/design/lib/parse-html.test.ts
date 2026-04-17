import { describe, it, expect } from "vitest";
import { parseHtmlWithSize } from "./parse-html";

describe("parseHtmlWithSize", () => {
  it("extracts size from HTML with size comment", () => {
    const input = "<!--size:800x600--><div>Hello</div>";
    const result = parseHtmlWithSize(input);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.html).toBe("<div>Hello</div>");
  });

  it("handles HTML without size comment", () => {
    const input = "<div>Hello</div>";
    const result = parseHtmlWithSize(input);
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
    expect(result.html).toBe("<div>Hello</div>");
  });

  it("removes markdown code fences", () => {
    const input = "```html\n<div>Hello</div>\n```";
    const result = parseHtmlWithSize(input);
    expect(result.html).toBe("<div>Hello</div>");
  });

  it("removes markdown code fences without language", () => {
    const input = "```\n<div>Hello</div>\n```";
    const result = parseHtmlWithSize(input);
    expect(result.html).toBe("<div>Hello</div>");
  });

  it("extracts Otto comment when enabled", () => {
    const input = "<!--otto:Design note--><div>Hello</div>";
    const result = parseHtmlWithSize(input, { extractComments: true });
    expect(result.comment).toBe("Design note");
    expect(result.html).toBe("<div>Hello</div>");
  });

  it("does not extract Otto comment when disabled", () => {
    const input = "<!--otto:Design note--><div>Hello</div>";
    const result = parseHtmlWithSize(input, { extractComments: false });
    expect(result.comment).toBeUndefined();
    expect(result.html).toContain("otto");
  });

  it("finds HTML start tag when preceded by whitespace", () => {
    const input = "   \n<div>Hello</div>";
    const result = parseHtmlWithSize(input);
    expect(result.html).toBe("<div>Hello</div>");
  });

  it("finds last closing tag", () => {
    const input = "<div>Hello</div>\nSome extra text";
    const result = parseHtmlWithSize(input);
    expect(result.html).toBe("<div>Hello</div>");
  });

  it("handles complex HTML with multiple tags", () => {
    const input = "<!--size:1200x800--><html><head><style>body{}</style></head><body><div>Content</div></body></html>";
    const result = parseHtmlWithSize(input);
    expect(result.width).toBe(1200);
    expect(result.height).toBe(800);
    expect(result.html).toContain("<html>");
    expect(result.html).toContain("</html>");
  });

  it("trims HTML by default", () => {
    const input = "<div>Hello</div>   ";
    const result = parseHtmlWithSize(input);
    expect(result.html).toBe("<div>Hello</div>");
  });

  it("preserves internal whitespace when trimHtml is false", () => {
    const input = "<div>Hello   World</div>";
    const result = parseHtmlWithSize(input, { trimHtml: false });
    expect(result.html).toBe("<div>Hello   World</div>");
  });
});
