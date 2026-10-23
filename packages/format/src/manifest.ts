import type { FrameEnv, FormatDef } from "./format";

/**
 * JSON-shaped mirror of `FormatDef` for declarative manifest files
 * (e.g. `format.json` shipped alongside assets). Asset paths are relative.
 */
export interface FormatManifest {
  id: string;
  extends?: string;
  frameEnv: Partial<FrameEnv>;
  promptSnippets?: Record<string, string>;
  exporters?: string[];
}

type JsonRecord = Record<string, unknown>;

const isPlainObject = (v: unknown): boolean =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const fail = (path: string, expected: string, value: unknown): never => {
  throw new Error(
    `format manifest: expected ${path} to be ${expected}, got ${
      Array.isArray(value) ? "array" : typeof value
    }`,
  );
};

const record = (v: unknown, path: string, expected = "an object"): JsonRecord => {
  if (!isPlainObject(v)) fail(path, expected, v);
  return v as JsonRecord;
};

const reqString = (obj: JsonRecord, key: string, path: string): string => {
  const v = obj[key];
  if (typeof v === "string") return v;
  fail(`${path}${key}`, "a string", v);
  return v as string;
};

const optString = (obj: JsonRecord, key: string, path: string): string | undefined => {
  const v = obj[key];
  if (v === undefined) return undefined;
  if (typeof v === "string") return v;
  fail(`${path}${key}`, "a string", v);
  return v as string;
};

const optStringArray = (obj: JsonRecord, key: string, path: string): string[] | undefined => {
  const v = obj[key];
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || v.some((s) => typeof s !== "string")) {
    fail(`${path}${key}`, "an array of strings", v);
  }
  return v as string[];
};

const optStringRecord = (
  obj: JsonRecord,
  key: string,
  path: string,
): Record<string, string> | undefined => {
  const v = obj[key];
  if (v === undefined) return undefined;
  const rec = record(v, `${path}${key}`, "a record of string to string");
  for (const val of Object.values(rec)) {
    if (typeof val !== "string") fail(`${path}${key}`, "a record of string to string", v);
  }
  return rec as Record<string, string>;
};

const parseFrameEnv = (value: unknown): Partial<FrameEnv> => {
  const obj = record(value, "frameEnv");
  const env: Partial<FrameEnv> = {};
  const scripts = optStringArray(obj, "scripts", "frameEnv.");
  if (scripts) env.scripts = scripts;
  const styles = optStringArray(obj, "styles", "frameEnv.");
  if (styles) env.styles = styles;
  const inlineCss = optString(obj, "inlineCss", "frameEnv.");
  if (inlineCss !== undefined) env.inlineCss = inlineCss;
  const attrs = optStringRecord(obj, "attrs", "frameEnv.");
  if (attrs) env.attrs = attrs;
  const bodyBackground = optString(obj, "bodyBackground", "frameEnv.");
  if (bodyBackground !== undefined) env.bodyBackground = bodyBackground;
  const animations = obj.animations;
  if (animations !== undefined) {
    if (animations !== "none" && animations !== "allow") {
      throw new Error(
        `format manifest: expected frameEnv.animations to be "none" | "allow", got ${JSON.stringify(animations)}`,
      );
    }
    env.animations = animations;
  }
  const customCssPassthrough = obj.customCssPassthrough;
  if (customCssPassthrough !== undefined) {
    if (typeof customCssPassthrough !== "boolean") {
      fail("frameEnv.customCssPassthrough", "a boolean", customCssPassthrough);
    }
    env.customCssPassthrough = customCssPassthrough as boolean;
  }
  return env;
};

/**
 * Strict, dependency-free validator: parses an unknown JSON value into a
 * `FormatDef` or throws a descriptive error. Unknown top-level keys are
 * ignored; `frameEnv` is required.
 */
export const parseManifest = (json: unknown): FormatDef => {
  const obj = record(json, "manifest");
  const id = reqString(obj, "id", "");
  const frameEnv = parseFrameEnv(obj.frameEnv);
  const def: FormatDef = { id, frameEnv };
  const ext = optString(obj, "extends", "");
  if (ext !== undefined) def.extends = ext;
  const promptSnippets = optStringRecord(obj, "promptSnippets", "");
  if (promptSnippets) def.promptSnippets = promptSnippets;
  const exporters = optStringArray(obj, "exporters", "");
  if (exporters) def.exporters = exporters;
  return def;
};
