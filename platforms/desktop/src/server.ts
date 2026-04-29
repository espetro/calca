import { readFileSync } from "fs";
import { resolve } from "path";

import serverApp from "@app/server/app";

import { VITE_DEV_URL, HOST } from "./constants";
import { getErrorPageHtml } from "./error-page";
import { versionInfo } from "./version";

let devMode = false;

export function isServerDev(): boolean {
	return devMode;
}

export function setServerDev(value: boolean): void {
	devMode = value;
}

const IDLE_TIMEOUT_IN_SECONDS = 0;

const STATIC_DIR = resolve(import.meta.dir, "../views/web");

const MIME_TYPES: Record<string, string> = {
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

function getContentType(filePath: string): string {
	const ext = filePath.split(".").pop()?.toLowerCase();
	return MIME_TYPES[ext ?? ""] ?? "application/octet-stream";
}

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

function serveStaticFile(pathname: string): Response {
	const cleanPath = pathname.replace(/^\/+/, "").replace(/\.\.\//g, "");
	const filePath = resolve(STATIC_DIR, cleanPath || "index.html");

	if (!filePath.startsWith(STATIC_DIR)) {
		return new Response("Forbidden", { status: 403 });
	}

	try {
		const content = readFileSync(filePath);
		return new Response(content, {
			headers: { "Content-Type": getContentType(filePath) },
		});
	} catch {
		try {
			const indexPath = resolve(STATIC_DIR, "index.html");
			const content = readFileSync(indexPath);
			return new Response(content, {
				headers: { "Content-Type": "text/html" },
			});
		} catch {
			return new Response(
				getErrorPageHtml("Not Found", "The requested page could not be found.", versionInfo.version),
				{ status: 404, headers: { "Content-Type": "text/html" } },
			);
		}
	}
}

export async function handleFetch(request: Request): Promise<Response> {
	const url = new URL(request.url);

	if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
		return serverApp.fetch(request);
	}

	if (isServerDev()) {
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
					versionInfo.version,
				),
				{
					status: 503,
					headers: { "Content-Type": "text/html" },
				},
			);
		}
	}

	return serveStaticFile(url.pathname);
}

export function startServer(): { port: number } {
	const server = Bun.serve({
		port: 0,
		hostname: HOST,
		fetch: handleFetch,
		idleTimeout: IDLE_TIMEOUT_IN_SECONDS,
		error: (error) => {
			console.error("[desktop] Server error:", error);
			return new Response(
				getErrorPageHtml("Server Error", `An unexpected error occurred: ${error.message}`, versionInfo.version),
				{
					status: 500,
					headers: { "Content-Type": "text/html" },
				},
			);
		},
	});
	const port = server.port;
	if (port === undefined) {
		throw new Error("Server failed to bind to a port");
	}
	return { port };
}
