import { describe, expect, it } from "vitest";

import {
  createFormatRegistry,
  mergeFormatEnvs,
  resolveFormatEnv,
  resolveFormatExporters,
  type FormatDef,
} from "./format";
import { parseManifest } from "./manifest";

const base: FormatDef = {
  id: "html",
  frameEnv: {
    scripts: ["base.js"],
    styles: ["base.css"],
    attrs: { "data-theme": "light" },
  },
};

describe("createFormatRegistry", () => {
  it("registers and gets definitions", () => {
    const registry = createFormatRegistry([base]);
    expect(registry.has("html")).toBe(true);
    expect(registry.get("html")).toBe(base);
  });

  it("has() returns false for unknown ids", () => {
    const registry = createFormatRegistry();
    expect(registry.has("nope")).toBe(false);
    expect(registry.get("nope")).toBeUndefined();
  });

  it("register() adds new definitions", () => {
    const registry = createFormatRegistry();
    registry.register(base);
    expect(registry.get("html")).toBe(base);
  });

  it("list() returns all definitions", () => {
    const child: FormatDef = { id: "html-tailwind", extends: "html", frameEnv: {} };
    const registry = createFormatRegistry([base, child]);
    expect(registry.list()).toEqual([base, child]);
  });

  it("registering the same id replaces", () => {
    const registry = createFormatRegistry([base]);
    const replacement: FormatDef = { id: "html", frameEnv: { animations: "allow" } };
    registry.register(replacement);
    expect(registry.get("html")).toBe(replacement);
  });
});

describe("resolveFormatEnv", () => {
  it("applies defaults for a standalone format", () => {
    const registry = createFormatRegistry([{ id: "bare", frameEnv: {} }]);
    expect(resolveFormatEnv(registry, "bare")).toEqual({
      scripts: [],
      styles: [],
      attrs: {},
      bodyBackground: "white",
      animations: "none",
      customCssPassthrough: false,
    });
  });

  it("resolves the extends chain parent-first", () => {
    const child: FormatDef = {
      id: "html-tailwind",
      extends: "html",
      frameEnv: {
        scripts: ["tailwind.js"],
        inlineCss: ".tw {}",
        bodyBackground: "#111",
      },
    };
    const registry = createFormatRegistry([base, child]);
    expect(resolveFormatEnv(registry, "html-tailwind")).toEqual({
      scripts: ["tailwind.js"],
      styles: ["base.css"],
      inlineCss: ".tw {}",
      attrs: { "data-theme": "light" },
      bodyBackground: "#111",
      animations: "none",
      customCssPassthrough: false,
    });
  });

  it("merges attrs field-wise down the chain", () => {
    const mid: FormatDef = {
      id: "mid",
      extends: "html",
      frameEnv: { attrs: { lang: "en" } },
    };
    const leaf: FormatDef = {
      id: "leaf",
      extends: "mid",
      frameEnv: { attrs: { "data-theme": "dark" } },
    };
    const registry = createFormatRegistry([base, mid, leaf]);
    expect(resolveFormatEnv(registry, "leaf").attrs).toEqual({
      "data-theme": "dark",
      lang: "en",
    });
  });

  it("merges promptSnippets and exporters from the whole chain", () => {
    const parent: FormatDef = {
      id: "p",
      frameEnv: {},
      promptSnippets: { plan: "parent plan" },
      exporters: ["png"],
    };
    const child: FormatDef = {
      id: "c",
      extends: "p",
      frameEnv: {},
      promptSnippets: { review: "child review" },
      exporters: ["pdf"],
    };
    const registry = createFormatRegistry([parent, child]);
    const def = registry.get("c")!;
    expect(def.promptSnippets).toEqual({ review: "child review" });
    expect(def.exporters).toEqual(["pdf"]);
  });

  it("resolveFormatExporters inherits exporters from the chain root when the leaf omits them", () => {
    const parent: FormatDef = { id: "p", frameEnv: {}, exporters: ["png"] };
    const child: FormatDef = { id: "c", extends: "p", frameEnv: {} };
    const registry = createFormatRegistry([parent, child]);
    expect(resolveFormatExporters(registry, "c")).toEqual(["png"]);
    expect(resolveFormatExporters(registry, "p")).toEqual(["png"]);
    expect(resolveFormatExporters(registry, "ghost")).toBeUndefined();
    const noExporters = createFormatRegistry([{ id: "bare", frameEnv: {} }]);
    expect(resolveFormatExporters(noExporters, "bare")).toBeUndefined();
  });

  it("throws on unknown format id", () => {
    const registry = createFormatRegistry();
    expect(() => resolveFormatEnv(registry, "ghost")).toThrow('unknown format "ghost"');
  });

  it("throws on unknown parent in the chain", () => {
    const orphan: FormatDef = { id: "orphan", extends: "missing", frameEnv: {} };
    const registry = createFormatRegistry([orphan]);
    expect(() => resolveFormatEnv(registry, "orphan")).toThrow("unknown parent");
  });

  it("throws on extends cycles", () => {
    const a: FormatDef = { id: "a", extends: "b", frameEnv: {} };
    const b: FormatDef = { id: "b", extends: "a", frameEnv: {} };
    const registry = createFormatRegistry([a, b]);
    expect(() => resolveFormatEnv(registry, "a")).toThrow(/cycle/);
  });

  it("throws on self-extends", () => {
    const self: FormatDef = { id: "self", extends: "self", frameEnv: {} };
    const registry = createFormatRegistry([self]);
    expect(() => resolveFormatEnv(registry, "self")).toThrow(/cycle/);
  });
});

describe("mergeFormatEnvs", () => {
  it("child arrays replace parent arrays", () => {
    const merged = mergeFormatEnvs(
      { scripts: ["a.js", "b.js"], styles: [] },
      { scripts: ["c.js"], styles: [] },
    );
    expect(merged.scripts).toEqual(["c.js"]);
  });

  it("child scalars win", () => {
    const merged = mergeFormatEnvs(
      { bodyBackground: "white", animations: "none", customCssPassthrough: false },
      { bodyBackground: "black", animations: "allow", customCssPassthrough: true },
    );
    expect(merged.bodyBackground).toBe("black");
    expect(merged.animations).toBe("allow");
    expect(merged.customCssPassthrough).toBe(true);
  });

  it("undefined child fields keep parent values", () => {
    const merged = mergeFormatEnvs(
      { scripts: ["a.js"], inlineCss: ".x {}", bodyBackground: "#fff" },
      { styles: ["z.css"] },
    );
    expect(merged.scripts).toEqual(["a.js"]);
    expect(merged.inlineCss).toBe(".x {}");
    expect(merged.bodyBackground).toBe("#fff");
  });

  it("merges attrs objects field-wise", () => {
    const merged = mergeFormatEnvs(
      { attrs: { "data-theme": "light", lang: "es" } },
      { attrs: { "data-theme": "dark" } },
    );
    expect(merged.attrs).toEqual({ "data-theme": "dark", lang: "es" });
  });
});

describe("parseManifest", () => {
  const valid = {
    id: "html-tailwind",
    extends: "html",
    frameEnv: {
      scripts: ["./tailwind.js"],
      styles: ["./base.css"],
      inlineCss: ".tw {}",
      attrs: { "data-theme": "light" },
      bodyBackground: "white",
      animations: "allow",
      customCssPassthrough: false,
    },
    promptSnippets: { plan: "use tailwind" },
    exporters: ["png"],
  };

  it("parses a valid manifest into a FormatDef", () => {
    const def = parseManifest(valid);
    expect(def).toEqual({
      id: "html-tailwind",
      extends: "html",
      frameEnv: {
        scripts: ["./tailwind.js"],
        styles: ["./base.css"],
        inlineCss: ".tw {}",
        attrs: { "data-theme": "light" },
        bodyBackground: "white",
        animations: "allow",
        customCssPassthrough: false,
      },
      promptSnippets: { plan: "use tailwind" },
      exporters: ["png"],
    });
    const registry = createFormatRegistry([base, def]);
    expect(resolveFormatEnv(registry, "html-tailwind").animations).toBe("allow");
  });

  it("accepts a minimal manifest", () => {
    expect(parseManifest({ id: "x", frameEnv: {} })).toEqual({ id: "x", frameEnv: {} });
  });

  it("rejects non-object input", () => {
    expect(() => parseManifest(null)).toThrow(/manifest/);
    expect(() => parseManifest([1])).toThrow(/an object/);
  });

  it("rejects missing or non-string id", () => {
    expect(() => parseManifest({ frameEnv: {} })).toThrow(/id.*string/);
    expect(() => parseManifest({ id: 1, frameEnv: {} })).toThrow(/id.*string/);
  });

  it("rejects missing or non-object frameEnv", () => {
    expect(() => parseManifest({ id: "x" })).toThrow(/frameEnv.*object/);
    expect(() => parseManifest({ id: "x", frameEnv: [] })).toThrow(/frameEnv.*object/);
  });

  it("rejects bad scripts/styles arrays", () => {
    expect(() => parseManifest({ id: "x", frameEnv: { scripts: "a.js" } })).toThrow(
      /frameEnv\.scripts/,
    );
    expect(() => parseManifest({ id: "x", frameEnv: { styles: [1] } })).toThrow(/frameEnv\.styles/);
  });

  it("rejects bad animations value", () => {
    expect(() => parseManifest({ id: "x", frameEnv: { animations: "yes" } })).toThrow(/animations/);
  });

  it("rejects non-boolean customCssPassthrough", () => {
    expect(() => parseManifest({ id: "x", frameEnv: { customCssPassthrough: "no" } })).toThrow(
      /customCssPassthrough/,
    );
  });

  it("rejects bad attrs and promptSnippets records", () => {
    expect(() => parseManifest({ id: "x", frameEnv: { attrs: { a: 1 } } })).toThrow(/attrs/);
    expect(() => parseManifest({ id: "x", frameEnv: {}, promptSnippets: { a: true } })).toThrow(
      /promptSnippets/,
    );
  });

  it("rejects bad exporters array", () => {
    expect(() => parseManifest({ id: "x", frameEnv: {}, exporters: "png" })).toThrow(/exporters/);
  });
});
