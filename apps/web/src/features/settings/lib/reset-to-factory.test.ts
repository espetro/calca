import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resetToFactory } from "./reset-to-factory";

const ORIGINAL_LOCAL_STORAGE = globalThis.localStorage;
const ORIGINAL_INDEXED_DB = globalThis.indexedDB;

const NOOP_MOCK = vi.fn();

const makeMockStorage = (initialEntries: Record<string, string> = {}) => {
  let store = { ...initialEntries };
  return {
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
};

const makeMockIDBDatabases = (dbs: { name?: string }[]) => vi.fn().mockResolvedValue(dbs);
const makeDeleteDBMock = () => {
  const calls: string[] = [];
  const mock = vi.fn().mockImplementation((name: string) => ({
    onsuccess: null,
    onerror: null,
    onblocked: null,
    onupgradeneeded: null,
    result: {
      close: NOOP_MOCK,
    },
  }));
  return mock;
};

describe("resetToFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "localStorage", { value: ORIGINAL_LOCAL_STORAGE, writable: true });
    Object.defineProperty(globalThis, "indexedDB", { value: ORIGINAL_INDEXED_DB, writable: true });
  });

  it("clears all calca-* localStorage keys, preserves others", async () => {
    const storage = makeMockStorage({
      "calca-settings": '{"apiKey":"test"}',
      "calca-canvas-session": '[]',
      "calca:session_start": '"2024-01-01"',
      "calca:last_session_end": '"2024-01-02"',
      "other-key": "keep-me",
    });
    Object.defineProperty(globalThis, "localStorage", { value: storage, writable: true });

    const deleteDBCalls: string[] = [];
    const mockDeleteDB = vi.fn().mockImplementation(() => ({
      onsuccess: null,
      onerror: null,
      result: { close: NOOP_MOCK },
    }));
    Object.defineProperty(globalThis, "indexedDB", {
      value: {
        databases: vi.fn().mockResolvedValue([]),
        deleteDatabase: mockDeleteDB,
      },
      writable: true,
    });

    await resetToFactory();

    expect(storage.getItem("calca-settings")).toBeNull();
    expect(storage.getItem("calca-canvas-session")).toBeNull();
    expect(storage.getItem("calca:session_start")).toBeNull();
    expect(storage.getItem("calca:last_session_end")).toBeNull();
    expect(storage.getItem("other-key")).toBe("keep-me");
  });

  it("handles missing storage APIs gracefully", async () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        length: 0,
        key: () => null,
        getItem: () => { throw new Error("localStorage unavailable"); },
        setItem: NOOP_MOCK,
        removeItem: NOOP_MOCK,
        clear: NOOP_MOCK,
      },
      writable: true,
    });
    Object.defineProperty(globalThis, "indexedDB", {
      value: {
        databases: vi.fn().mockRejectedValue(new Error("indexedDB unavailable")),
      },
      writable: true,
    });

    await expect(resetToFactory()).resolves.toBe(false);
  });

  it("returns true when all operations succeed", async () => {
    const storage = makeMockStorage({ "calca-settings": "x", "other": "y" });
    Object.defineProperty(globalThis, "localStorage", { value: storage, writable: true });
    Object.defineProperty(globalThis, "indexedDB", {
      value: {
        databases: vi.fn().mockResolvedValue([]),
        deleteDatabase: vi.fn().mockImplementation(() => ({
          onsuccess: null,
          onerror: null,
          result: { close: NOOP_MOCK },
        })),
      },
      writable: true,
    });

    const result = await resetToFactory();
    expect(result).toBe(true);
  });
});
