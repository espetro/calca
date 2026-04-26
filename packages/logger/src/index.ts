import {
  configure,
  type Logger as LogtapeLogger,
  type LogLevel,
  getLogger as getLogtapeLogger,
  getConsoleSink,
  isLogLevel,
} from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";

const DEFAULT_LOG_LEVEL: LogLevel = "info";

function toLogtapeLevel(level: string): LogLevel {
  if (level === "warn") return "warning";
  if (level === "silent") return "fatal";
  if (isLogLevel(level)) return level;
  return DEFAULT_LOG_LEVEL;
}

function getLogLevelFromEnv(env: Record<string, string | undefined>): LogLevel {
  const envLevel = env.LOG_LEVEL?.toLowerCase();
  const validLevels = ["debug", "info", "warn", "error", "silent"];

  if (envLevel && validLevels.includes(envLevel)) {
    return toLogtapeLevel(envLevel);
  }

  return DEFAULT_LOG_LEVEL;
}

let isConfigured = false;

function getLogLevel(
  level: string | undefined,
  env: Record<string, string | undefined>,
): LogLevel {
  if (level !== undefined) {
    return toLogtapeLevel(level);
  }
  return getLogLevelFromEnv(env);
}

export async function createLogger(
  level: string | undefined = undefined,
  env: Record<string, string | undefined> = process.env ?? {},
): Promise<void> {
  if (isConfigured) {
    return;
  }

  const logLevel = getLogLevel(level, env);

  const isBrowser =
    typeof globalThis !== "undefined" && "window" in globalThis;

  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: isBrowser
          ? undefined
          : getPrettyFormatter({
              timestamp: "time",
              level: "ABBR",
            }),
      }),
    },
    filters: {},
    loggers: [
      {
        category: ["calca"],
        lowestLevel: logLevel,
        sinks: ["console"],
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
    ],
  });

  isConfigured = true;
}

export function getLogger(category: string[]): LogtapeLogger {
  return getLogtapeLogger(category);
}
