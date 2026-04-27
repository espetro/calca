import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const enJsonPath = resolve(__dirname, "../messages/en.json");

describe("i18n messages", () => {
  it("en.json must exist and be valid JSON", () => {
    const raw = readFileSync(enJsonPath, "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("onboarding.welcomeTitle must exist and be non-empty", () => {
    const raw = readFileSync(enJsonPath, "utf8");
    const messages = JSON.parse(raw) as Record<string, unknown>;
    const val =
      messages.onboarding && (messages.onboarding as Record<string, unknown>).welcomeTitle;
    expect(val).toBeDefined();
    expect(typeof val).toBe("string");
    expect((val as string).trim().length).toBeGreaterThan(0);
  });

  it("onboarding.welcomeDescription must exist and be non-empty", () => {
    const raw = readFileSync(enJsonPath, "utf8");
    const messages = JSON.parse(raw) as Record<string, unknown>;
    const val =
      messages.onboarding && (messages.onboarding as Record<string, unknown>).welcomeDescription;
    expect(val).toBeDefined();
    expect(typeof val).toBe("string");
    expect((val as string).trim().length).toBeGreaterThan(0);
  });

  it("canvas.emptyTitle must exist and be non-empty", () => {
    const raw = readFileSync(enJsonPath, "utf8");
    const messages = JSON.parse(raw) as Record<string, unknown>;
    const val = messages.canvas && (messages.canvas as Record<string, unknown>).emptyTitle;
    expect(val).toBeDefined();
    expect(typeof val).toBe("string");
    expect((val as string).trim().length).toBeGreaterThan(0);
  });

  it("canvas.emptyDescription must exist and be non-empty", () => {
    const raw = readFileSync(enJsonPath, "utf8");
    const messages = JSON.parse(raw) as Record<string, unknown>;
    const val = messages.canvas && (messages.canvas as Record<string, unknown>).emptyDescription;
    expect(val).toBeDefined();
    expect(typeof val).toBe("string");
    expect((val as string).trim().length).toBeGreaterThan(0);
  });

  it("toolbar.importDesign must exist and be non-empty", () => {
    const raw = readFileSync(enJsonPath, "utf8");
    const messages = JSON.parse(raw) as Record<string, unknown>;
    const val = messages.toolbar && (messages.toolbar as Record<string, unknown>).importDesign;
    expect(val).toBeDefined();
    expect(typeof val).toBe("string");
    expect((val as string).trim().length).toBeGreaterThan(0);
  });

  it("toolbar.exportDesign must exist and be non-empty", () => {
    const raw = readFileSync(enJsonPath, "utf8");
    const messages = JSON.parse(raw) as Record<string, unknown>;
    const val = messages.toolbar && (messages.toolbar as Record<string, unknown>).exportDesign;
    expect(val).toBeDefined();
    expect(typeof val).toBe("string");
    expect((val as string).trim().length).toBeGreaterThan(0);
  });

  it("no i18n value may be an empty string", () => {
    const raw = readFileSync(enJsonPath, "utf8");
    const messages = JSON.parse(raw) as Record<string, unknown>;
    const emptyStrings: string[] = [];

    function collectEmptyStrings(obj: Record<string, unknown>, prefix = ""): void {
      for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof val === "string" && val.trim() === "") {
          emptyStrings.push(path);
        } else if (typeof val === "object" && val !== null) {
          collectEmptyStrings(val as Record<string, unknown>, path);
        }
      }
    }

    collectEmptyStrings(messages);
    expect(emptyStrings, `Empty strings found at: ${emptyStrings.join(", ")}`).toHaveLength(0);
  });
});
