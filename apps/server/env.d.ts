type LogLevel = "trace" | "debug" | "info" | "warning" | "error" | "fatal";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly LOG_LEVEL: LogLevel;
    }
  }
}

// oxlint-disable-next-line unicorn/require-module-specifiers
export {};
