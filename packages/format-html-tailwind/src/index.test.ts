import { resolveFormatEnv } from "@calca/format/browser";
import { describe, expect, it } from "vitest";

import { createDefaultFormatRegistry, htmlTailwindFormat, TAILWIND_SCRIPT_TOKEN } from "./index";

describe("htmlTailwindFormat", () => {
  it("is registered in the default registry", () => {
    const registry = createDefaultFormatRegistry();
    expect(registry.has("html-tailwind")).toBe(true);
    expect(registry.get("html-tailwind")).toBe(htmlTailwindFormat);
  });

  it("resolves to a full FrameEnv with the tailwind script token", () => {
    const env = resolveFormatEnv(createDefaultFormatRegistry(), "html-tailwind");
    expect(env).toEqual({
      animations: "none",
      attrs: {},
      bodyBackground: "white",
      customCssPassthrough: true,
      scripts: [TAILWIND_SCRIPT_TOKEN],
      styles: [],
    });
    expect(TAILWIND_SCRIPT_TOKEN).toBe("calca:tailwind");
  });
});
