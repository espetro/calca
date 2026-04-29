import { getLogger } from "@logtape/logtape";
import type { BrowserWindow } from "electrobun/bun";
import { Updater } from "electrobun/bun";

const log = getLogger(["calca", "desktop", "updater"]);

function sendStateToWebview(
	win: BrowserWindow,
	state: Record<string, unknown>,
): void {
	const script = `window.__calcaUpdaterStateCallback?.(${JSON.stringify(state)})`;
	win.webview.executeJavascript(script);
}

export const updaterHandlers = {
	updater__startDownload: async () => {
		try {
			await downloadAndPrepare();
		} catch (error) {
			log.error`startDownload handler error: ${error}`;
		}
	},
	updater__apply: async () => {
		try {
			await applyIfReady();
		} catch (error) {
			log.error`apply handler error: ${error}`;
		}
	},
};

export async function checkAndNotify(win?: BrowserWindow): Promise<void> {
	try {
		const info = await Updater.getLocallocalInfo();
		const result = await Updater.checkForUpdate();

		if (Updater.updateInfo()?.updateReady) {
			if (win) sendStateToWebview(win, { state: "ready", version: result.version });
			return;
		}

		if (result.updateAvailable) {
			if (win)
				sendStateToWebview(win, {
					state: "available",
					version: result.version,
					currentVersion: info.version,
				});
		}
	} catch (error) {
		log.error`checkAndNotify failed: ${error}`;
	}
}

export async function downloadAndPrepare(win?: BrowserWindow): Promise<void> {
	try {
		Updater.onStatusChange((entry) => {
			if (entry.status === "download-progress" && win) {
				sendStateToWebview(win, { state: "downloading" });
			}
		});

		if (win) sendStateToWebview(win, { state: "downloading" });

		await Updater.downloadUpdate();

		if (Updater.updateInfo()?.updateReady && win) {
			sendStateToWebview(win, {
				state: "ready",
				version: Updater.updateInfo()?.version ?? "",
			});
		}
	} catch (error) {
		log.error`downloadAndPrepare failed: ${error}`;
	}
}

export async function applyIfReady(): Promise<void> {
	if (!Updater.updateInfo()?.updateReady) {
		log.warn`applyIfReady: update not ready yet`;
		return;
	}

	try {
		await Updater.applyUpdate();
	} catch (error) {
		log.error`applyIfReady failed: ${error}`;
	}
}
