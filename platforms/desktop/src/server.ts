// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/server.ts
 *
 * Server configuration and request handler.
 */

import serverApp from "@app/server/app";

import { isDev, VITE_DEV_URL, HOST, PORT } from "./constants";
import { getErrorPageHtml } from "./error-page";

const IDLE_TIMEOUT_IN_SECONDS = 0; // ! No timeout – we must set per-request timeout

export async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) return;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

function getContentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html",
    js: "application/javascript",
    mjs: "application/javascript",
    css: "text/css",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    webp: "image/webp",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
  };
  return types[ext ?? ""] ?? "application/octet-stream";
}

export async function handleFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // API routes must be handled before the dev proxy to avoid an infinite loop
  if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
    return serverApp.fetch(request);
  }

  if (isDev) {
    try {
      const response = await fetch(new URL(url.pathname + url.search, VITE_DEV_URL), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: "manual",
      });
      return response;
    } catch {
      return new Response(
        getErrorPageHtml(
          "Dev Server Unavailable",
          "Could not connect to the Vite development server. Make sure to run the web app first.",
        ),
        {
          status: 503,
          headers: { "Content-Type": "text/html" },
        },
      );
    }
  }

  // Production: static files are served via views:// protocol, only API routes handled here
  return new Response(
    getErrorPageHtml(
      "Not Found",
      "This endpoint is not available in production mode.",
    ),
    {
      status: 404,
      headers: { "Content-Type": "text/html" },
    },
  );
}

export function startServer(): void {
  Bun.serve({
    port: PORT,
    hostname: HOST,
    fetch: handleFetch,
    idleTimeout: IDLE_TIMEOUT_IN_SECONDS,
    error: (error) => {
      console.error("[desktop] Server error:", error);
      return new Response(
        getErrorPageHtml("Server Error", `An unexpected error occurred: ${error.message}`),
        {
          status: 500,
          headers: { "Content-Type": "text/html" },
        },
      );
    },
  });
}
