import { getTimeRotatingFileSink } from "@logtape/file";
import { configure, getConsoleSink } from "@logtape/logtape";

let initialized = false;

interface InitLoggerOptions {
  logDir: string;
  prefix?: string;
}

export async function initLogger({ logDir, prefix = "app" }: InitLoggerOptions): Promise<void> {
  if (initialized) return;

  await configure({
    sinks: {
      console: getConsoleSink(),
      file: getTimeRotatingFileSink({
        directory: logDir,
        filename: (date: Date) => {
          const iso = date.toISOString().split("T")[0];
          return `${prefix}-${iso}.log`;
        },
        interval: "daily",
        maxAgeMs: 7 * 24 * 60 * 60 * 1000,
      }),
    },
    loggers: [
      {
        category: "calca",
        sinks: ["console", "file"],
        lowestLevel: "info",
      },
      {
        category: ["calca", "desktop"],
        sinks: ["console", "file"],
        lowestLevel: "info",
      },
      {
        category: ["calca", "desktop", "server"],
        sinks: ["console", "file"],
        lowestLevel: "info",
      },
      {
        category: ["calca", "desktop", "database"],
        sinks: ["console", "file"],
        lowestLevel: "info",
      },
      {
        category: "logtape",
        sinks: ["console"],
        lowestLevel: "error",
      },
    ],
  });

  initialized = true;
}
