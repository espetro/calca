import { describe, expect, it } from "vitest";

import { callTool, createCanvasSession, type SessionFormat } from "../src/index";

const formats: SessionFormat[] = [
  {
    def: {
      id: "base",
      frameEnv: { styles: ["base.css"], attrs: { "data-theme": "dark" }, animations: "allow" },
      exporters: ["html"],
    },
    sourcePath: "/tmp/base.json",
  },
  {
    def: {
      id: "child",
      extends: "base",
      frameEnv: { inlineCss: "body{margin:0}" },
      promptSnippets: { layout: "use daisyUI classes" },
    },
    sourcePath: "/tmp/child.json",
  },
];

describe("canvas.formats", () => {
  it("returns an empty list when the session has no formats", async () => {
    const session = createCanvasSession();
    const res = (await callTool(session, "canvas.formats", {})) as {
      formats: unknown[];
      warnings: string[];
    };
    expect(res.formats).toEqual([]);
    expect(res.warnings).toEqual([]);
  });

  it("lists discovered formats with resolved frame envs", async () => {
    const session = createCanvasSession({ formats });
    const res = (await callTool(session, "canvas.formats", {})) as {
      formats: {
        id: string;
        extends?: string;
        exporters?: string[];
        frameEnv: Record<string, unknown>;
        promptSnippets?: Record<string, string>;
        sourcePath: string;
      }[];
      warnings: string[];
    };

    expect(res.formats.map((f) => f.id)).toEqual(["base", "child"]);
    const child = res.formats[1];
    expect(child?.extends).toBe("base");
    expect(child?.promptSnippets).toEqual({ layout: "use daisyUI classes" });
    expect(child?.sourcePath).toBe("/tmp/child.json");
    expect(child?.frameEnv).toEqual({
      scripts: [],
      styles: ["base.css"],
      inlineCss: "body{margin:0}",
      attrs: { "data-theme": "dark" },
      bodyBackground: "white",
      animations: "allow",
      customCssPassthrough: false,
    });
    expect(res.warnings).toEqual([]);
  });

  it("warns when an extends target is missing", async () => {
    const session = createCanvasSession({
      formats: [
        { def: { id: "orphan", extends: "ghost", frameEnv: {} }, sourcePath: "/tmp/o.json" },
      ],
    });
    const res = (await callTool(session, "canvas.formats", {})) as {
      formats: { id: string; frameEnv: unknown }[];
      warnings: string[];
    };
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0]).toContain("ghost");
    expect(res.formats[0]?.id).toBe("orphan");
  });

  it("surfaces session-level discovery warnings alongside runtime warnings", async () => {
    const session = createCanvasSession({
      formats: [
        { def: { id: "orphan", extends: "ghost", frameEnv: {} }, sourcePath: "/tmp/o.json" },
      ],
      formatWarnings: ["formats: skipping /tmp/bad.json: unexpected token"],
    });
    const res = (await callTool(session, "canvas.formats", {})) as {
      formats: { id: string; frameEnv: unknown }[];
      warnings: string[];
    };
    expect(res.warnings).toContain("formats: skipping /tmp/bad.json: unexpected token");
    expect(res.warnings.some((w) => w.includes("ghost"))).toBe(true);
  });

  it("inherits exporters from the extends chain when the leaf has none", async () => {
    const session = createCanvasSession({
      formats: [
        {
          def: {
            id: "root",
            frameEnv: {},
            exporters: ["standalone-html"],
          },
          sourcePath: "/tmp/root.json",
        },
        {
          def: { id: "leaf", extends: "root", frameEnv: {} },
          sourcePath: "/tmp/leaf.json",
        },
      ],
    });
    const res = (await callTool(session, "canvas.formats", {})) as {
      formats: { id: string; exporters?: string[] }[];
      warnings: string[];
    };
    expect(res.formats.find((f) => f.id === "leaf")?.exporters).toEqual(["standalone-html"]);
  });
});
