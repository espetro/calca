import {
  type LogLevel,
  type Logger as LogtapeLogger,
  configure,
  getConsoleSink,
  getLogger as getLogtapeLogger,
  isLogLevel,
} from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";

const DEFAULT_LOG_LEVEL: LogLevel = "info";

// * Module-level flag to cache if the logger has been already configured
let isConfigured = false;

const getLogLevel = (level: LogLevel | undefined): LogLevel => {
  if (level === undefined) {
    return DEFAULT_LOG_LEVEL;
  }

  const parsed = level.trim().toLowerCase();

  if (isLogLevel(parsed)) {
    return parsed;
  }

  console.warn(`Unknown log level ${parsed}. Setting to ${DEFAULT_LOG_LEVEL}`);
  return DEFAULT_LOG_LEVEL;
};

export async function createLogger(level?: LogLevel) {
  if (isConfigured) {
    return;
  }

  const validLevel = getLogLevel(level);
  console.log(`Log level set to ${validLevel}`);

  const isBrowser = typeof globalThis !== "undefined" && "window" in globalThis;
  const formatter = isBrowser
    ? undefined
    : getPrettyFormatter({ level: "ABBR", timestamp: "time" });

  await configure({
    filters: {},
    loggers: [
      {
        category: ["calca"],
        lowestLevel: validLevel,
        sinks: ["console"],
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
    ],
    sinks: {
      console: getConsoleSink({
        formatter,
      }),
    },
  });

  isConfigured = true;
}

export function getLogger(category: string[]): LogtapeLogger {
  return getLogtapeLogger(category);
}
