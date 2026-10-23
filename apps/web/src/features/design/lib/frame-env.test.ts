import { describe, expect, it } from "vitest";

import { applySettingsToFrameEnv, getFrameEnv } from "../lib/frame-env";

const BASE_ENV = {
  animations: "none" as const,
  attrs: { "data-theme": "light" },
  bodyBackground: "white",
  customCssPassthrough: true,
  inlineCss: "/* base */",
  scripts: [],
  styles: [],
};

describe("applySettingsToFrameEnv", () => {
  it("returns undefined for an unresolved env", () => {
    expect(applySettingsToFrameEnv(undefined, { animationsAllowed: false })).toBeUndefined();
  });

  it("merges frame attrs, settings win", () => {
    const merged = applySettingsToFrameEnv(BASE_ENV, {
      animationsAllowed: false,
      frameAttrs: { "data-theme": "dark", "data-lang": "en" },
    });
    expect(merged?.attrs).toEqual({
      "data-lang": "en",
      "data-theme": "dark",
    });
  });

  it("keeps base attrs when no attrs are configured", () => {
    const merged = applySettingsToFrameEnv(BASE_ENV, { animationsAllowed: false });
    expect(merged?.attrs).toEqual({ "data-theme": "light" });
  });

  it("flips animations to allow when enabled", () => {
    const merged = applySettingsToFrameEnv(BASE_ENV, { animationsAllowed: true });
    expect(merged?.animations).toBe("allow");
  });

  it("appends custom css to inline css", () => {
    const merged = applySettingsToFrameEnv(BASE_ENV, {
      animationsAllowed: false,
      customCss: "body { color: red; }",
    });
    expect(merged?.inlineCss).toContain("body { color: red; }");
    expect(merged?.inlineCss).toContain("/* base */");
  });

  it("ignores custom css when the format disallows passthrough", () => {
    const merged = applySettingsToFrameEnv(
      { ...BASE_ENV, customCssPassthrough: false },
      { animationsAllowed: false, customCss: "body { color: red; }" },
    );
    expect(merged?.inlineCss).toBe("/* base */");
  });
});

describe("getFrameEnv", () => {
  it("resolves the built-in format", () => {
    const env = getFrameEnv();
    expect(env).toBeDefined();
    expect(env?.animations).toBe("none");
  });

  it("applies settings on top of the resolved env", () => {
    const env = getFrameEnv("html-tailwind", {
      animationsAllowed: true,
      frameAttrs: { "data-theme": "dark" },
    });
    expect(env?.animations).toBe("allow");
    expect(env?.attrs?.["data-theme"]).toBe("dark");
  });

  it("returns undefined for an unknown format", () => {
    expect(getFrameEnv("nope")).toBeUndefined();
  });
});
