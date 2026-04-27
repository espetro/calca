import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  optOutCapturing: vi.fn(),
  optInCapturing: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  posthog: {
    init: mocks.init,
    capture: mocks.capture,
    opt_out_capturing: mocks.optOutCapturing,
    opt_in_capturing: mocks.optInCapturing,
  },
}));

function setupLocalStorage(getReturn: string | null = null) {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: vi.fn().mockReturnValue(getReturn),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
}

describe("posthog-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("initAnalytics", () => {
    it("sets up PostHog with correct config when API key is provided", async () => {
      setupLocalStorage();
      const { initAnalytics } = await import("../posthog-client");

      initAnalytics("test-api-key");

      expect(mocks.init).toHaveBeenCalledTimes(1);
      const [apiKey, config] = mocks.init.mock.calls[0]!;
      expect(apiKey).toBe("test-api-key");
      expect(config.api_host).toBe("https://eu.posthog.com");
      expect(config.disable_external_dependency_loading).toBe(true);
      expect(config.persistence).toBe("localStorage");
    });

    it("skips initialization when no API key is provided", async () => {
      setupLocalStorage();
      Object.defineProperty(import.meta, "env", {
        value: { VITE_POSTHOG_KEY: "" },
        configurable: true,
        writable: true,
      });

      const { initAnalytics } = await import("../posthog-client");

      initAnalytics();

      expect(mocks.init).not.toHaveBeenCalled();
    });

    it("respects user opt-out from localStorage", async () => {
      setupLocalStorage("false");
      const { initAnalytics } = await import("../posthog-client");

      initAnalytics("test-api-key");

      expect(mocks.init).not.toHaveBeenCalled();
    });

    it("is idempotent — only initializes once", async () => {
      setupLocalStorage();
      const { initAnalytics } = await import("../posthog-client");

      initAnalytics("test-api-key");
      initAnalytics("test-api-key");
      initAnalytics("test-api-key");

      expect(mocks.init).toHaveBeenCalledTimes(1);
    });
  });

  describe("captureEvent", () => {
    it("captures event when analytics is enabled", async () => {
      setupLocalStorage();
      const { initAnalytics, captureEvent } = await import("../posthog-client");

      initAnalytics("test-api-key");

      captureEvent("app:session_end", { sessionDurationMs: 5000, designsCreated: 3 });

      expect(mocks.capture).toHaveBeenCalledTimes(1);
      expect(mocks.capture).toHaveBeenCalledWith("app:session_end", {
        sessionDurationMs: 5000,
        designsCreated: 3,
      });
    });

    it("is no-op when analytics is disabled (no API key)", async () => {
      setupLocalStorage();
      Object.defineProperty(import.meta, "env", {
        value: { VITE_POSTHOG_KEY: "" },
        configurable: true,
        writable: true,
      });

      const { initAnalytics, captureEvent } = await import("../posthog-client");

      initAnalytics();
      captureEvent("app:session_start");

      expect(mocks.capture).not.toHaveBeenCalled();
    });

    it("is no-op when user has opted out", async () => {
      setupLocalStorage("false");
      const { initAnalytics, captureEvent } = await import("../posthog-client");

      initAnalytics("test-api-key");
      captureEvent("app:session_start");

      expect(mocks.capture).not.toHaveBeenCalled();
    });
  });

  describe("optOut", () => {
    it("calls posthog.opt_out_capturing and disables further captures", async () => {
      setupLocalStorage();
      const { initAnalytics, optOut, captureEvent, isAnalyticsEnabled } =
        await import("../posthog-client");

      initAnalytics("test-api-key");
      optOut();

      expect(mocks.optOutCapturing).toHaveBeenCalledTimes(1);
      expect(isAnalyticsEnabled()).toBe(false);

      captureEvent("app:session_start");
      expect(mocks.capture).not.toHaveBeenCalled();
    });

    it("sets localStorage to record opt-out preference", async () => {
      setupLocalStorage();
      const { initAnalytics, optOut } = await import("../posthog-client");

      initAnalytics("test-api-key");
      optOut();

      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        "calca:analytics_enabled",
        "false",
      );
    });
  });

  describe("optIn", () => {
    it("calls posthog.opt_in_capturing and re-enables captures", async () => {
      setupLocalStorage();
      const { initAnalytics, optIn, isAnalyticsEnabled } = await import(
        "../posthog-client"
      );

      initAnalytics("test-api-key");

      setupLocalStorage("false");
      optIn();

      expect(mocks.optInCapturing).toHaveBeenCalledTimes(1);
      expect(isAnalyticsEnabled()).toBe(true);
    });

    it("sets localStorage to record opt-in preference", async () => {
      setupLocalStorage();
      const { initAnalytics, optIn } = await import("../posthog-client");

      initAnalytics("test-api-key");

      optIn();

      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        "calca:analytics_enabled",
        "true",
      );
    });
  });

  describe("isAnalyticsEnabled", () => {
    it("returns false when not initialized", async () => {
      setupLocalStorage();
      const { isAnalyticsEnabled } = await import("../posthog-client");
      expect(isAnalyticsEnabled()).toBe(false);
    });

    it("returns true after successful initialization", async () => {
      setupLocalStorage();
      const { initAnalytics, isAnalyticsEnabled } = await import("../posthog-client");

      initAnalytics("test-api-key");
      expect(isAnalyticsEnabled()).toBe(true);
    });

    it("returns false after opt-out", async () => {
      setupLocalStorage();
      const { initAnalytics, optOut, isAnalyticsEnabled } = await import(
        "../posthog-client"
      );

      initAnalytics("test-api-key");
      optOut();
      expect(isAnalyticsEnabled()).toBe(false);
    });
  });
});
