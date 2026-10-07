import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const messagesDir = resolve(__dirname, "../../../../messages");
const enJsonPath = resolve(messagesDir, "en.json");

const loadJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;

// paraglide-js compiles each message id to an exported JS identifier, so keys
// must be flat valid identifiers (convention: `group_key`, e.g.
// `onboarding_welcomeTitle`) — nested message objects are not supported.
const VALID_ID = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

describe("i18n messages", () => {
  it("en.json must exist and be valid JSON", () => {
    const raw = readFileSync(enJsonPath, "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("every message id must be a valid JS identifier", () => {
    const messages = loadJson(enJsonPath);
    const invalid = Object.keys(messages).filter((key) => key !== "$schema" && !VALID_ID.test(key));
    expect(invalid, `Invalid message ids: ${invalid.join(", ")}`).toHaveLength(0);
  });

  it("every message value must be a non-empty string", () => {
    const messages = loadJson(enJsonPath);
    const bad: string[] = [];
    for (const [key, val] of Object.entries(messages)) {
      if (key === "$schema") continue;
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
    const sourceKeys = Object.keys(loadJson(enJsonPath))
      .filter((key) => key !== "$schema")
      .sort();
    const localeFiles = readdirSync(messagesDir).filter(
      (file) => file.endsWith(".json") && file !== "en.json",
    );
    for (const file of localeFiles) {
      const keys = Object.keys(loadJson(resolve(messagesDir, file)))
        .filter((key) => key !== "$schema")
        .sort();
      expect(keys, `${file} diverges from en.json`).toEqual(sourceKeys);
    }
  });
});
