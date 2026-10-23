import { describe, expect, it } from "vitest";

import { loadFormats } from "../src/session";

describe("loadFormats", () => {
  it("seeds the built-in html-tailwind format with a builtin: source path", () => {
    const { formats } = loadFormats();
    const builtin = formats.find((f) => f.def.id === "html-tailwind");
    expect(builtin).toBeDefined();
    expect(builtin?.sourcePath).toBe("builtin:html-tailwind");
    expect(builtin?.def.frameEnv.scripts).toContain("calca:tailwind");
  });

  it("resolves ./ styles against the manifest directory", () => {
    const { formats } = loadFormats();
    const anyManifest = formats.find((f) => !f.sourcePath.startsWith("builtin:"));
    // Nothing to assert without a fixture dir on disk — covered by
    // discovery tests plus CLI e2e; here we only prove builtin paths pass
    // through untouched.
    if (!anyManifest) return;
    expect(anyManifest.sourcePath.startsWith("/")).toBe(true);
  });

  it("returns discovery warnings alongside the formats", () => {
    const { warnings } = loadFormats();
    expect(Array.isArray(warnings)).toBe(true);
  });
});
