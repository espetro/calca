import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const srcRoot = resolve(__dirname, "../..");

function grepFiles(pattern: string, glob: string): string[] {
  try {
    const output = execSync(
      `grep -rli --include="${glob}" "${pattern}" "${srcRoot}" 2>/dev/null || true`,
      { encoding: "utf8", timeout: 15_000 },
    );
    return output
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

describe("rebrand verification", () => {
  function matchesExcludingExport(pattern: string): string[] {
    return grepFiles(pattern, "*.ts*").filter(
      (f) => !f.includes("/export/") && !f.includes("__tests__"),
    );
  }

  it("must not contain the old brand name 'gosto' (case-insensitive, whole word)", () => {
    const matches = matchesExcludingExport(String.raw`\bgosto\b`);
    expect(matches).toHaveLength(0);
  });

  it("must not contain 'calcar' (the typo, case-insensitive, whole word)", () => {
    const matches = matchesExcludingExport(String.raw`\bcalcar\b`);
    expect(matches).toHaveLength(0);
  });

  it("must not contain the old .otto file format outside the export module", () => {
    const matches = matchesExcludingExport(String.raw`\.otto\b`);
    expect(matches).toHaveLength(0);
  });
});
