import { posthog } from "posthog-js";
import type { AnalyticsEventProperties } from "./types";

const ANALYTICS_ENABLED_KEY = "calca:analytics_enabled";
const POSTHOG_KEY = import.meta.env["VITE_POSTHOG_KEY"] as string | undefined;

let isEnabled = false;

function hasUserOptedOut(): boolean {
  if (typeof localStorage === "undefined") return true;
  const stored = localStorage.getItem(ANALYTICS_ENABLED_KEY);
  if (stored === null) return false;
  return stored === "false";
}

function initAnalytics(key?: string): void {
  if (isEnabled) return;
  if (hasUserOptedOut()) return;

  const apiKey = key ?? POSTHOG_KEY;

  if (!apiKey) {
    console.warn("[analytics] No PostHog API key provided. Set VITE_POSTHOG_KEY env var.");
    return;
  }

  posthog.init(apiKey, {
    api_host: "https://eu.posthog.com",
    disable_external_dependency_loading: true,
    persistence: "localStorage",
    bootstrap: {
      featureFlags: {},
    },
    loaded: (ph) => {
      ph.set_config({ debug: false });
    },
    cookieless: "on_reject" as const,
  } as Parameters<typeof posthog.init>[1]);

  isEnabled = true;
}

function captureEvent(event: string, properties?: AnalyticsEventProperties): void {
  if (!isEnabled) return;
  posthog.capture(event, properties);
}

function optOut(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ANALYTICS_ENABLED_KEY, "false");
  }
  if (isEnabled) {
    posthog.opt_out_capturing();
    isEnabled = false;
  }
}

function optIn(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ANALYTICS_ENABLED_KEY, "true");
  }
  initAnalytics();
  if (isEnabled) {
    posthog.opt_in_capturing();
  }
}

function isAnalyticsEnabled(): boolean {
  return isEnabled;
}

export { initAnalytics, captureEvent, optOut, optIn, isAnalyticsEnabled };
