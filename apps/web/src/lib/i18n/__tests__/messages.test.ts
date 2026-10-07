import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const messagesDir = resolve(__dirname, "../../../../messages");
const enJsonPath = resolve(messagesDir, "en.json");

const loadJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;

// Messages may be flat (`group_key`) or nested (`group: { key }`); nested
// objects are flattened to `group_key` ids (see inlang/message-format-nested.js)
// before paraglide-js compiles them to JS identifiers, so every leaf id must
// be a valid identifier.
const VALID_ID = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const flattenMessages = (
  obj: Record<string, unknown>,
  prefix = "",
  out: Record<string, unknown> = {},
): Record<string, unknown> => {
  for (const [key, value] of Object.entries(obj)) {
    if (prefix === "" && key === "$schema") continue;
    const id = prefix ? `${prefix}_${key}` : key;
    if (value && typeof value === "object") {
      flattenMessages(value as Record<string, unknown>, id, out);
    } else {
      out[id] = value;
    }
  }
  return out;
};

describe("i18n messages", () => {
  it("en.json must exist and be valid JSON", () => {
    const raw = readFileSync(enJsonPath, "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("every message id must be a valid JS identifier", () => {
    const messages = flattenMessages(loadJson(enJsonPath));
    const invalid = Object.keys(messages).filter((key) => !VALID_ID.test(key));
    expect(invalid, `Invalid message ids: ${invalid.join(", ")}`).toHaveLength(0);
  });

  it("every message value must be a non-empty string", () => {
    const messages = flattenMessages(loadJson(enJsonPath));
    const bad: string[] = [];
    for (const [key, val] of Object.entries(messages)) {
      if (typeof val !== "string" || val.trim() === "") bad.push(key);
    }
    expect(bad, `Non-string or empty messages at: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("onboarding_welcomeTitle must exist and be non-empty", () => {
    const val = loadJson(enJsonPath).onboarding_welcomeTitle;
    expect(typeof val).toBe("string");
    expect((val as string).trim().length).toBeGreaterThan(0);
  });

  it("canvas_emptyTitle must exist and be non-empty", () => {
    const val = loadJson(enJsonPath).canvas_emptyTitle;
    expect(typeof val).toBe("string");
    expect((val as string).trim().length).toBeGreaterThan(0);
  });

  it("toolbar_importDesign must exist and be non-empty", () => {
    const val = loadJson(enJsonPath).toolbar_importDesign;
    expect(typeof val).toBe("string");
    expect((val as string).trim().length).toBeGreaterThan(0);
  });

  it("every locale file must cover exactly the en keys", () => {
    const sourceKeys = Object.keys(flattenMessages(loadJson(enJsonPath))).sort();
    const localeFiles = readdirSync(messagesDir).filter(
      (file) => file.endsWith(".json") && file !== "en.json",
    );
    for (const file of localeFiles) {
      const keys = Object.keys(flattenMessages(loadJson(resolve(messagesDir, file)))).sort();
      expect(keys, `${file} diverges from en.json`).toEqual(sourceKeys);
    }
  });
});
