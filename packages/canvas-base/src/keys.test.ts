import { describe, expect, it } from "vitest";

import { generateKeyBetween, generateNKeysBetween, isValidIndex } from "./keys";

describe("keys", () => {
  it("generates a first key", () => {
    const k = generateKeyBetween(null, null);
    expect(isValidIndex(k)).toBe(true);
  });

  it("orders sequentially generated keys", () => {
    let prev: string | null = null;
    for (let i = 0; i < 200; i++) {
      const k = generateKeyBetween(prev, null);
      if (prev !== null) expect(k > prev).toBe(true);
      expect(isValidIndex(k)).toBe(true);
      prev = k;
    }
  });

  it("generates keys before the first", () => {
    let next = generateKeyBetween(null, null);
    for (let i = 0; i < 100; i++) {
      const k = generateKeyBetween(null, next);
      expect(k < next).toBe(true);
      expect(isValidIndex(k)).toBe(true);
      next = k;
    }
  });

  it("generates keys between two keys", () => {
    let a = generateKeyBetween(null, null);
    let b = generateKeyBetween(a, null);
    for (let i = 0; i < 100; i++) {
      const k = generateKeyBetween(a, b);
      expect(k > a).toBe(true);
      expect(k < b).toBe(true);
      expect(isValidIndex(k)).toBe(true);
      if (i % 2 === 0) a = k;
      else b = k;
    }
  });

  it("interleaves keys from multiple insert positions", () => {
    const keys = [generateKeyBetween(null, null)];
    for (let i = 0; i < 50; i++) {
      const pos = Math.floor(Math.random() * (keys.length + 1));
      const key = generateKeyBetween(keys[pos - 1] ?? null, keys[pos] ?? null);
      keys.splice(pos, 0, key);
      expect([...keys].sort()).toEqual(keys);
    }
  });

  it("generates N ordered keys", () => {
    const keys = generateNKeysBetween(null, null, 7);
    expect(keys).toHaveLength(7);
    expect([...keys].sort()).toEqual(keys);
    keys.forEach((k) => expect(isValidIndex(k)).toBe(true));
  });

  it("rejects invalid inputs", () => {
    expect(() => generateKeyBetween("a0", null)).toThrow();
    expect(() => generateKeyBetween(null, "bad key!")).toThrow();
    expect(() => generateKeyBetween("V", "F")).toThrow();
  });
});
