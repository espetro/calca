// @ts-nocheck - Electrobun types have issues, but the API works at runtime
/**
 * platforms/desktop/src/updater.ts
 *
 * Auto-update module for the Calca desktop app.
 * Uses Electrobun's built-in Updater for hash-based update detection and patching.
 */

import { Updater } from "electrobun/bun";
import { getMainWindow } from "./window";
import { versionInfo } from "./version";

// ============================================================================
// RPC Message Senders
// ============================================================================

function sendStateToWebview(state: Record<string, unknown>): void {
	const mainWindow = getMainWindow();
	if (!mainWindow) return;

	// Call the global callback that UpdateNotification.tsx registers
	const script = `window.__calcaUpdaterStateCallback?.(${JSON.stringify(state)})`;
	mainWindow.evaluate(script);
}

// ============================================================================
// checkAndNotify
// ============================================================================

/**
 * Checks for updates and notifies the webview if one is available.
 * Also sends a "ready" notification if an update was already downloaded.
 */
export async function checkAndNotify(): Promise<void> {
	try {
		const result = await Updater.checkForUpdate();

		if (Updater.updateInfo()?.updateReady) {
			sendStateToWebview({ state: "ready", version: result.version });
			return;
		}

		if (result.updateAvailable) {
			sendStateToWebview({
				state: "available",
				version: result.version,
				currentVersion: versionInfo.version,
			});
		}
	} catch (error) {
		console.error("[updater] checkAndNotify failed:", error);
	}
}

// ============================================================================
// downloadAndPrepare
// ============================================================================

/**
 * Downloads the update and notifies the webview of progress.
 * After successful download, sends a "ready" notification.
 */
export async function downloadAndPrepare(): Promise<void> {
	try {
		Updater.onStatusChange((entry) => {
			if (entry.status === "download-progress") {
				sendStateToWebview({ state: "downloading" });
			}
		});

		sendStateToWebview({ state: "downloading" });

		await Updater.downloadUpdate();

		if (Updater.updateInfo()?.updateReady) {
			sendStateToWebview({
				state: "ready",
				version: Updater.updateInfo()?.version ?? "",
			});
		}
	} catch (error) {
		console.error("[updater] downloadAndPrepare failed:", error);
	}
}

// ============================================================================
// applyIfReady
// ============================================================================

export async function applyIfReady(): Promise<void> {
	if (!Updater.updateInfo()?.updateReady) {
		console.warn("[updater] applyIfReady: update not ready yet");
		return;
	}

	try {
		await Updater.applyUpdate();
	} catch (error) {
		console.error("[updater] applyIfReady failed:", error);
	}
}
