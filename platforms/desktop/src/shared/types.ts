import type { RPCSchema } from "electrobun/bun";

export type ContextMenuAction =
  | "cut"
  | "copy"
  | "paste"
  | "duplicate"
  | "delete"
  | "export"
  | "selectAll";

export interface ContextMenuParams {
  selectedCount: number;
  hasClipboardContent: boolean;
}

export interface ContextMenuResult {
  action: ContextMenuAction;
}

export interface CalcaRPCSchema {
  bun: RPCSchema<{
    requests: {
      updater__startDownload: { params: void; response: void };
      updater__apply: { params: void; response: void };
      contextMenu__show: { params: ContextMenuParams; response: ContextMenuResult };
    };
  }>;
  webview: RPCSchema;
}
