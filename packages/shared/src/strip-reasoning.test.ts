import { describe, expect, it } from "vitest";

import { validateLayout } from "./schemas/layout";
import { stripReasoningBlocks } from "./strip-reasoning";

describe("stripReasoningBlocks", () => {
  it("removes <think> blocks before real content", () => {
    const raw = `<think>reasoning about the design...</think>\n<div>hello</div>`;
    expect(stripReasoningBlocks(raw)).toBe("\n<div>hello</div>");
  });

  it("removes <reasoning> and <thought> blocks", () => {
    const raw = `<reasoning>r</reasoning><div>a</div><thought>t</thought>`;
    expect(stripReasoningBlocks(raw)).toBe("<div>a</div>");
  });

  it("removes reasoning blocks nested inside html", () => {
    const raw = `<div><think>inner</think><p>content</p></div>`;
    expect(stripReasoningBlocks(raw)).toBe("<div><p>content</p></div>");
  });

  it("strips an unclosed trailing block to EOF (truncated output)", () => {
    const raw = `<div>ok</div>\n<think>cut off mid-thou`;
    expect(stripReasoningBlocks(raw)).toBe("<div>ok</div>\n");
  });

  it("handles blocks with attributes and case-insensitive tags", () => {
    const raw = `<THINK type="x">up</THINK><REASONING step="1">r</reasoning><div>ok</div>`;
    expect(stripReasoningBlocks(raw)).toBe("<div>ok</div>");
  });

  it("leaves content without reasoning blocks untouched", () => {
    const raw = `<div>plain</div>`;
    expect(stripReasoningBlocks(raw)).toBe(raw);
  });
});

describe("validateLayout reasoning gate", () => {
  it("accepts layout output wrapped in a think block", () => {
    const raw = `<think>design</think>\n<div>hello</div>`;
    expect(validateLayout(raw).html).toBe("<div>hello</div>");
  });

  it("rejects output that is only a think block", () => {
    expect(() => validateLayout(`<think>only reasoning</think>`)).toThrow();
  });
});
