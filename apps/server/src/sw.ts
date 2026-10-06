/**
 * Service-worker runtime for the Hono app.
 *
 * The statically-deployed web demo (`/app/`) has no API server: this worker is
 * served from the site root and answers same-origin `/api/*` (and `/health`)
 * requests in-browser, leaving every other path to the static host.
 *
 * `app.ts` uses top-level await (logger setup), so it is imported lazily — a
 * static import would emit top-level await in the bundle, which only module
 * service workers support. Bun inlines the dynamic import when bundling to a
 * single file.
 */

// `ServiceWorkerGlobalScope`/`FetchEvent` live in lib "webworker", which this
// tsconfig does not include — declare the small surface the worker needs.
interface ServiceWorkerExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface ServiceWorkerFetchEvent extends ServiceWorkerExtendableEvent {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
}

interface ServiceWorkerScope {
  clients: { claim(): Promise<void> };
  skipWaiting(): Promise<void>;
  addEventListener(type: "fetch", listener: (event: ServiceWorkerFetchEvent) => void): void;
  addEventListener(
    type: "install" | "activate",
    listener: (event: ServiceWorkerExtendableEvent) => void,
  ): void;
}

const appPromise = import("./app").then((m) => m.default);

const sw = self as unknown as ServiceWorkerScope;

// Take control immediately: without `clients.claim()` the page that registered
// this worker stays uncontrolled until reload, and its /api fetches bypass the
// worker entirely (straight to the static host → 405).
sw.addEventListener("install", () => sw.skipWaiting());
sw.addEventListener("activate", (event) => event.waitUntil(sw.clients.claim()));

sw.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
    event.respondWith(appPromise.then((app) => app.fetch(event.request)));
  }
});
