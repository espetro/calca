declare global {
  export type LogLevel = "trace" | "debug" | "info" | "warning" | "error" | "fatal";

  namespace NodeJS {
    interface ProcessEnv {
      readonly LOG_LEVEL: LogLevel;
    }
  }
}

// oxlint-disable-next-line unicorn/require-module-specifiers
export {};
