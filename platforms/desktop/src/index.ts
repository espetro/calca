import { getLogger } from "@logtape/logtape";
import { Updater } from "electrobun/bun";

import { VITE_DEV_URL } from "./constants";
import { versionInfo } from "./version";
import { setupApplicationMenu } from "./menu";
import { waitForServer, startServer, setServerDev } from "./server";
import { setupStorageDir } from "./storage";
import { createWindow } from "./window";
import { checkAndNotify } from "./updater";
import { getMainWindow } from "./window";

const log = getLogger(["calca", "desktop"]);

declare global {
	interface GlobalThis {
		__CALCA_UPDATE_AVAILABLE__?: boolean;
		__CALCA_UPDATE_VERSION__?: string;
	}
}

async function main(): Promise<void> {
	const startupTimer = { start: Date.now() };
	log.info`Starting Calca v${versionInfo.version}`;

	const channel = await Updater.localInfo.channel().catch(() => "unknown");
	const devMode = channel === "dev";
	setServerDev(devMode);
	log.info`Channel: ${channel} (${devMode ? "development" : "production"})`;

	setupStorageDir();
	setupApplicationMenu();

	if (devMode) {
		log.debug`Waiting for Vite dev server at ${VITE_DEV_URL}...`;
		await waitForServer(`${VITE_DEV_URL}/`, 60000).catch((e) => {
			log.error`Vite dev server not available: ${e}`;
		});
		const { port } = startServer();
		const serverUrl = `http://localhost:${port}`;
		log.info`Desktop server at ${serverUrl}`;
		createWindow(VITE_DEV_URL);
	} else {
		const { port } = startServer();
		const serverUrl = `http://localhost:${port}`;
		log.info`Server running on ${serverUrl}`;

		await waitForServer(`${serverUrl}/health`, 10000).catch((e) => {
			log.error`Health check failed: ${e}`;
		});

		createWindow(serverUrl);
	}

	// Pass window instance to updater so it can push state
	const win = getMainWindow();
	if (win) {
		checkAndNotify(win);
		setInterval(() => {
			const currentWin = getMainWindow();
			if (currentWin) checkAndNotify(currentWin);
		}, 60 * 60 * 1000);
	}

	const elapsed = Date.now() - startupTimer.start;
	log.debug`Startup completed in ${elapsed}ms`;
}

main().catch((e) => {
	console.error("[desktop] Fatal error:", e);
	process.exit(1);
});
