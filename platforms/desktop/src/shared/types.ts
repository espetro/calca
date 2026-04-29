import type { RPCSchema } from "electrobun/bun";

export interface CalcaRPCSchema {
  bun: RPCSchema<{
    requests: {
      updater__startDownload: { params: void; response: void };
      updater__apply: { params: void; response: void };
    };
  }>;
  webview: RPCSchema;
}
