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
const VALID_LEVELS: LogLevel[] = ["debug", "info", "warning", "error", "fatal"];

const toLogtapeLevel = (level: LogLevel) => (isLogLevel(level) ? level : DEFAULT_LOG_LEVEL);

function getLogLevelFromEnv(env: typeof process.env): LogLevel {
  const envLevel: string | undefined = env.LOG_LEVEL?.toLowerCase();

  if (envLevel && VALID_LEVELS.includes(envLevel as LogLevel)) {
    return toLogtapeLevel(envLevel as LogLevel);
  }

  return DEFAULT_LOG_LEVEL;
}

let isConfigured = false;

function getLogLevel(level: LogLevel, env: typeof process.env): LogLevel {
  if (level !== undefined) {
    return toLogtapeLevel(level);
  }
  return getLogLevelFromEnv(env);
}

export async function createLogger(level: LogLevel = "info", env?: typeof process.env) {
  const environment = env ?? (typeof process !== "undefined" ? process.env : {});
  if (isConfigured) {
    return;
  }

  const logLevel = getLogLevel(level, environment);

  const isBrowser = typeof globalThis !== "undefined" && "window" in globalThis;

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
