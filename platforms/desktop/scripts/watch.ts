// oxlint-disable unicorn/require-module-specifiers
// oxlint-disable no-await-in-loop

const changeToRoot = () => {
  const root = import.meta.dirname;
  process.chdir(root + "/../..");
};

const waitForViteReady = async () => {
  console.log("==> Waiting for Vite dev server to be ready...");
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch("http://localhost:5173");
      if (res.ok) {
        console.log("==> Vite is ready");
        return;
      }
    } catch {}

    await Bun.sleep(500);
  }
};

const main = async () => {
  changeToRoot();

  console.log("==> Starting web dev server...");
  const webProc = Bun.spawn(["bun", "run", "--filter=@app/web", "dev"], {
    stdout: "inherit",
    stderr: "inherit",
  });

  await waitForViteReady();

  console.log("==> Starting Electrobun desktop app...");
  const electrobunProc = Bun.spawn(["bun", "run", "--filter=@app/electrobun", "watch"], {
    stdout: "inherit",
    stderr: "inherit",
    onExit() {
      webProc.kill();
      process.exit();
    },
  });

  process.on("SIGINT", () => {
    webProc.kill();
    electrobunProc.kill();
    process.exit();
  });
};

await main();

export {};
