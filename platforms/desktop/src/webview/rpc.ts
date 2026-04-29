// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/webview/rpc.ts
 *
 * Inbound RPC handlers for the updater feature.
 * Registers handlers that respond to requests from the webview.
 */

import { downloadAndPrepare, applyIfReady } from "../updater";
import type { BrowserView } from "electrobun/bun";

// ============================================================================
// Webview Reference (for updater.ts to send messages to webview)
// ============================================================================

let activeWebview: BrowserView | null = null;

/**
 * Returns the currently active BrowserView for updater RPC.
 * Used by updater.ts to send messages to the webview.
 */
export function getUpdaterWebview(): BrowserView | null {
	return activeWebview;
}

// ============================================================================
// RPC Handlers
// ============================================================================

/**
 * Sets up inbound RPC handlers for the updater feature on a BrowserView.
 * Handlers respond to requests from the webview.
 *
 * @param webview - The BrowserView to attach handlers to
 */
export function setupUpdaterRPC(webview: BrowserView) {
	activeWebview = webview;

	webview.rpc.setRequestHandler({
		updater__startDownload: async () => {
			try {
				await downloadAndPrepare();
			} catch (error) {
				console.error("[updater] startDownload handler error:", error);
			}
		},
		updater__apply: async () => {
			try {
				await applyIfReady();
			} catch (error) {
				console.error("[updater] apply handler error:", error);
			}
		},
	});
}