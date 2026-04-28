import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { canSubmitFeedback, recordSubmission, resetRateLimitState } from "./rate-limiter";

const mockLocalStorage = new Map<string, string>();
const mockSessionStorage = new Map<string, string>();

beforeEach(() => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();

  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => mockLocalStorage.get(key) ?? null,
      setItem: (key: string, value: string) => mockLocalStorage.set(key, value),
      removeItem: (key: string) => mockLocalStorage.delete(key),
      clear: () => mockLocalStorage.clear(),
      key: (index: number) => Array.from(mockLocalStorage.keys())[index] ?? null,
      get length() {
        return mockLocalStorage.size;
      },
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, "sessionStorage", {
    value: {
      getItem: (key: string) => mockSessionStorage.get(key) ?? null,
      setItem: (key: string, value: string) => mockSessionStorage.set(key, value),
      removeItem: (key: string) => mockSessionStorage.delete(key),
      clear: () => mockSessionStorage.clear(),
      key: (index: number) => Array.from(mockSessionStorage.keys())[index] ?? null,
      get length() {
        return mockSessionStorage.size;
      },
    },
    writable: true,
    configurable: true,
  });

  resetRateLimitState();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("canSubmitFeedback", () => {
  it("allows submission in fresh state", () => {
    const result = canSubmitFeedback();
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("blocks rapid re-submission due to debounce", () => {
    recordSubmission();

    const result = canSubmitFeedback();
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Please wait before submitting again");
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});

describe("daily quota reset", () => {
  it("resets on new day", () => {
    for (let i = 0; i < 10; i++) {
      recordSubmission();
    }
    expect(canSubmitFeedback().allowed).toBe(false);

    const originalDate = globalThis.Date;
    const mockDate = new Date("2025-01-02T00:00:00.000Z");
    Object.defineProperty(globalThis, "Date", {
      value: class extends originalDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(mockDate.getTime());
          } else {
            super(...(args as [string | number | Date]));
          }
        }
        static now() {
          return mockDate.getTime();
        }
      },
      writable: true,
      configurable: true,
    });

    resetRateLimitState();
    expect(canSubmitFeedback().allowed).toBe(true);

    Object.defineProperty(globalThis, "Date", {
      value: originalDate,
      writable: true,
      configurable: true,
    });
  });
});
