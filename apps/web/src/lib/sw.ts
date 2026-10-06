/**
 * The statically-deployed demo (`/app/` on GitHub Pages) has no API server.
 * A root-scoped service worker (`/sw.js`, built from apps/server) hosts the
 * same Hono app and intercepts same-origin `/api/*` and `/health` requests.
 *
 * Skipped when:
 * - not a production build (dev uses the Vite proxy / real server)
 * - an explicit `VITE_API_BASE_URL` points at an external API server
 * - the browser lacks service worker support
 */
let apiWorkerPromise: Promise<void> | undefined;

export function ensureApiWorker(): Promise<void> {
  apiWorkerPromise ??= (async () => {
    if (!import.meta.env.PROD || import.meta.env.VITE_API_BASE_URL) return;
    if (!("serviceWorker" in navigator)) return;

    try {
      await navigator.serviceWorker.register("/sw.js");
      // Wait for activation so the first API call is intercepted, then for
      // the worker's clients.claim() to make this page a controlled client.
      if (!navigator.serviceWorker.controller) {
        await Promise.race([
          new Promise<void>((resolve) =>
            navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
              once: true,
            }),
          ),
          navigator.serviceWorker.ready.then(() => undefined),
          // Never hang: without a controller the calls surface the real
          // static-host error instead.
          new Promise<void>((resolve) => setTimeout(resolve, 2000)),
        ]);
      }
    } catch (error) {
      // Resolve anyway: API calls then surface the real static-host error
      // (e.g. 405) instead of hanging on a never-resolving promise.
      console.warn("API service worker registration failed:", error);
    }
  })();
  return apiWorkerPromise;
}
