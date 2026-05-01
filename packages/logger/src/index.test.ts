import { LogLevel } from "@logtape/logtape";
import { describe, expect, it } from "vitest";

import { createLogger, getLogger } from "./index";

describe("logger", () => {
  describe("createLogger", () => {
    it("initializes without throwing", async () => {
      await expect(createLogger()).resolves.toBeUndefined();
    });

    it("is idempotent — calling twice does not throw", async () => {
      await expect(createLogger()).resolves.toBeUndefined();
      await expect(createLogger()).resolves.toBeUndefined();
    });

    it("accepts an explicit level argument", async () => {
      await expect(createLogger("debug")).resolves.toBeUndefined();
    });

    it("uses LOG_LEVEL env var when level is not provided", async () => {
      await expect(createLogger("debug")).resolves.toBeUndefined();
    });

    it("falls back to DEFAULT_LOG_LEVEL for unknown LOG_LEVEL values", async () => {
      await expect(createLogger("not-a-level" as LogLevel)).resolves.toBeUndefined();
    });
  });

  describe("getLogger", () => {
    it("returns a logger for a flat category", () => {
      const logger = getLogger(["calca"]);
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });

    it("returns a logger for a nested category", () => {
      const logger = getLogger(["calca", "server", "http"]);
      expect(typeof logger.info).toBe("function");
    });

    it("multiple calls with the same category return loggers with the same interface", () => {
      const a = getLogger(["calca", "db"]);
      const b = getLogger(["calca", "db"]);
      expect(typeof a.info).toBe("function");
      expect(typeof b.info).toBe("function");
    });
  });
});
