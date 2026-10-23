import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { realpathSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, sep } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { discoverFormatDirs, loadFormatsFromDir, resolveFormats } from "./discovery";

let root: string;
let home: string;

const writeManifest = (dir: string, name: string, json: unknown): string => {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, name);
  writeFileSync(file, JSON.stringify(json));
  return file;
};

const realHome = homedir();

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "calca-formats-"));
  home = mkdtempSync(join(tmpdir(), "calca-home-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(home, { recursive: true, force: true });
});

describe("discoverFormatDirs", () => {
  it("collects nearest-first .calca/formats dirs walking upward", () => {
    const top = join(root, "top");
    const mid = join(top, "mid");
    mkdirSync(mid, { recursive: true });
    writeManifest(join(top, ".calca", "formats"), "a.json", { id: "a", frameEnv: {} });
    writeManifest(join(mid, ".calca", "formats"), "b.json", { id: "b", frameEnv: {} });

    const dirs = discoverFormatDirs({ startDir: mid, home });
    expect(dirs).toEqual([
      join(realpathSync(mid), ".calca", "formats"),
      join(realpathSync(top), ".calca", "formats"),
    ]);
  });

  it("walks past a repository boundary (no .git stop)", () => {
    const repo = join(root, "repo");
    const nested = join(repo, "packages", "pkg");
    mkdirSync(join(repo, ".git"), { recursive: true });
    mkdirSync(nested, { recursive: true });
    writeManifest(join(repo, ".calca", "formats"), "a.json", { id: "a", frameEnv: {} });

    const dirs = discoverFormatDirs({ startDir: nested, home });
    expect(dirs).toContain(join(realpathSync(repo), ".calca", "formats"));
  });

  it("falls back to home formats dir", () => {
    writeManifest(join(home, ".calca", "formats"), "a.json", { id: "a", frameEnv: {} });
    const dirs = discoverFormatDirs({ startDir: root, home });
    expect(dirs).toEqual([join(realpathSync(home), ".calca", "formats")]);
  });

  it("stops at the home directory (does not walk above it)", () => {
    // Nest home inside the cleaned root so fixtures never leak into the
    // shared tmpdir.
    const nestedHome = join(root, "home");
    const deep = join(nestedHome, "work", "sub");
    mkdirSync(deep, { recursive: true });
    writeManifest(join(root, ".calca", "formats"), "x.json", { id: "x", frameEnv: {} });
    const dirs = discoverFormatDirs({ startDir: deep, home: nestedHome });
    expect(dirs).toEqual([]);
  });

  it("returns CALCA_FORMATS verbatim when set", () => {
    const dirs = discoverFormatDirs({
      startDir: root,
      home,
      env: { CALCA_FORMATS: "/some/custom/dir" },
    });
    expect(dirs).toEqual(["/some/custom/dir"]);
  });

  it("ignores empty/whitespace CALCA_FORMATS", () => {
    writeManifest(join(home, ".calca", "formats"), "a.json", { id: "a", frameEnv: {} });
    const dirs = discoverFormatDirs({
      startDir: root,
      home,
      env: { CALCA_FORMATS: "   " },
    });
    expect(dirs).toEqual([join(realpathSync(home), ".calca", "formats")]);
  });

  it("dedupes symlinked directories via realpath", () => {
    const real = join(root, "real");
    const link = join(root, "link");
    mkdirSync(real, { recursive: true });
    symlinkSync(real, link);
    const inside = join(link, "deep");
    mkdirSync(inside, { recursive: true });
    writeManifest(join(real, ".calca", "formats"), "a.json", { id: "a", frameEnv: {} });

    const dirs = discoverFormatDirs({ startDir: inside, home });
    expect(dirs).toEqual([join(realpathSync(real), ".calca", "formats")]);
  });

  it("returns empty array when nothing exists", () => {
    expect(discoverFormatDirs({ startDir: root, home })).toEqual([]);
  });
});

describe("loadFormatsFromDir", () => {
  it("parses all json manifests and skips malformed ones with warnings", () => {
    const dir = join(root, ".calca", "formats");
    writeManifest(dir, "good.json", {
      id: "good",
      frameEnv: { styles: ["a.css"] },
      exporters: ["html"],
    });
    writeManifest(dir, "bad-syntax.json", { id: "bad" });
    writeFileSync(join(dir, "bad-syntax.json"), "{ not json");
    writeManifest(dir, "bad-schema.json", { id: 42, frameEnv: {} });
    writeFileSync(join(dir, "notes.txt"), "ignore me");

    const { formats, warnings } = loadFormatsFromDir(dir);
    expect(formats.map((f) => f.def.id)).toEqual(["good"]);
    expect(formats[0]?.sourcePath).toBe(join(dir, "good.json"));
    expect(warnings).toHaveLength(2);
    expect(warnings.some((w) => w.includes("bad-syntax.json"))).toBe(true);
    expect(warnings.some((w) => w.includes("bad-schema.json"))).toBe(true);
  });

  it("warns on unreadable directory", () => {
    const { formats, warnings } = loadFormatsFromDir(join(root, "missing"));
    expect(formats).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});

describe("resolveFormats", () => {
  it("deepest definition wins per id", () => {
    const top = join(root, "top");
    const mid = join(top, "mid");
    mkdirSync(mid, { recursive: true });
    writeManifest(join(top, ".calca", "formats"), "f.json", {
      id: "f",
      frameEnv: { styles: ["parent.css"], bodyBackground: "black" },
    });
    writeManifest(join(mid, ".calca", "formats"), "f.json", {
      id: "f",
      frameEnv: { styles: ["child.css"] },
    });

    const { registry, sources } = resolveFormats({ startDir: mid, home });
    expect(sources.map((s) => s.sourcePath.split(sep).pop())).toEqual(["f.json", "f.json"]);
    const def = registry.get("f");
    expect(def?.frameEnv.styles).toEqual(["child.css"]);
  });

  it("resolves extends across directory levels", () => {
    const top = join(root, "top");
    const mid = join(top, "mid");
    mkdirSync(mid, { recursive: true });
    writeManifest(join(top, ".calca", "formats"), "base.json", {
      id: "base",
      frameEnv: { styles: ["base.css"], attrs: { "data-theme": "dark" }, animations: "allow" },
    });
    writeManifest(join(mid, ".calca", "formats"), "child.json", {
      id: "child",
      extends: "base",
      frameEnv: { inlineCss: "body{margin:0}" },
    });

    const { registry, warnings } = resolveFormats({ startDir: mid, home });
    expect(warnings).toEqual([]);
    const child = registry.get("child");
    expect(child?.frameEnv).toEqual({
      scripts: [],
      styles: ["base.css"],
      inlineCss: "body{margin:0}",
      attrs: { "data-theme": "dark" },
      bodyBackground: "white",
      animations: "allow",
      customCssPassthrough: false,
    });
  });

  it("warns (does not throw) when extends target is missing", () => {
    const dir = join(root, ".calca", "formats");
    writeManifest(dir, "orphan.json", { id: "orphan", extends: "ghost", frameEnv: {} });
    const { registry, warnings } = resolveFormats({ startDir: root, home });
    expect(registry.has("orphan")).toBe(true);
    expect(warnings.some((w) => w.includes("ghost"))).toBe(true);
  });

  it("returns empty registry with no warnings when no formats exist", () => {
    const { registry, warnings, sources } = resolveFormats({ startDir: root, home });
    expect(registry.list()).toEqual([]);
    expect(warnings).toEqual([]);
    expect(sources).toEqual([]);
  });

  it("loads only the CALCA_FORMATS override", () => {
    const dir = join(root, "custom-formats");
    writeManifest(dir, "only.json", { id: "only", frameEnv: { scripts: ["x.js"] } });

    const { registry } = resolveFormats({
      startDir: root,
      home,
      env: { CALCA_FORMATS: dir },
    });
    expect(registry.list().map((d) => d.id)).toEqual(["only"]);
  });
});

describe("homedir injection", () => {
  it("does not throw when home does not exist", () => {
    const missing = join(root, "no-such-home");
    const dirs = discoverFormatDirs({ startDir: root, home: missing });
    expect(dirs.every((d) => !d.includes("no-such-home"))).toBe(true);
  });
  it("defaults home to os.homedir(), never $HOME env", () => {
    // Discovery with default home must terminate and include the real home
    // formats dir only if it exists — just assert it does not throw and
    // every result is an absolute path.
    const dirs = discoverFormatDirs({ startDir: root });
    for (const d of dirs) expect(d.startsWith("/")).toBe(true);
  });
});
