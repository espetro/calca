import { describe, it, expect } from "vitest";
import {
  DESIGN_EXTENSION,
  IMPORT_EXTENSIONS,
} from "../index";

describe("export format constants", () => {
  it("DESIGN_EXTENSION must equal .design", () => {
    expect(DESIGN_EXTENSION).toBe(".design");
  });

  it("IMPORT_EXTENSIONS must include .otto for backward compatibility", () => {
    expect(IMPORT_EXTENSIONS).toContain(".otto");
  });

  it("IMPORT_EXTENSIONS must include .design", () => {
    expect(IMPORT_EXTENSIONS).toContain(".design");
  });

  it("IMPORT_EXTENSIONS must have .otto before .design (detection order)", () => {
    const ottoIdx = IMPORT_EXTENSIONS.indexOf(".otto");
    const designIdx = IMPORT_EXTENSIONS.indexOf(".design");
    expect(ottoIdx).toBeLessThan(designIdx);
  });
});
