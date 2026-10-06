# Service Worker API Runtime

Tags: sw

Covers the **SW-backed** API topology (issue #74): the production build served
statically under `/app/` with a root `/sw.js` (bundled `apps/server` Hono app)
answering `/api/*` and `/health`. Run via `bun run test:e2e:sw`; excluded from
the default server-backed suite by the `sw` tag.

## The app shell loads with a clean console

* Open "/"
* Wait for page to load completely
* The page should have no console errors

## The service worker registers and controls the page

* Open "/"
* The page should be controlled by a service worker

## The worker answers the health endpoint

* Open "/"
* In-page fetch "GET" "/health" should return status "200"
* In-page fetch "/health" should return JSON "status" "ok"

## The worker passes non-API paths through to the static host

* Open "/"
* In-page fetch "GET" "/favicon.ico" should return status "200"
* In-page fetch "GET" "/api/no-such-route" should return status "404"

## A failing BYOK probe surfaces a real error

* Open "/"
* A provider probe to a dead endpoint should surface an error

## A generation without a working provider surfaces a real error

* Open "/?quickMode=true"
* Seed a broken provider
* Reload the page
* Fill "A minimal footer bar" in the "Prompt" field
* Press the "Enter" key
* The canvas should show a generation error
