import posthog from "posthog-js";
import { useEffect } from "react";

type PostHogInitOptions = Parameters<typeof posthog.init>[1];

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

export default function PostHogInit() {
  useEffect(() => {
    if (!POSTHOG_KEY) {
      console.warn(
        "[analytics] No PostHog API key provided. Set VITE_PUBLIC_POSTHOG_PROJECT_TOKEN env var.",
      );
      return;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST || "https://us.i.posthog.com",
      disable_external_dependency_loading: true,
      persistence: "localStorage",
      bootstrap: {
        featureFlags: {},
      },
      loaded: (ph) => {
        ph.set_config({ debug: false });
      },
      cookieless_mode: "on_reject",
    } satisfies PostHogInitOptions);

    posthog.capture("$pageview", {
      $current_url: window.location.href,
      $pathname: window.location.pathname,
    });
  }, []);

  return null;
}
