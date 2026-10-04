export { CanvasSession, createCanvasSession, createSessionShared } from "./session";
export { MAX_LEASE_TTL_MS, MAX_OPS_PER_CALL } from "./session";
export type { CanvasSessionOptions, Lease, Proposal, SessionShared } from "./session";

export {
  canvasApply,
  canvasArrange,
  canvasComment,
  canvasLease,
  canvasPropose,
  canvasRead,
  canvasRelease,
} from "./tools";
export type {
  Affected,
  ApplyArgs,
  ArrangeArgs,
  CommentArgs,
  ErrorCode,
  LeaseArgs,
  MutationResult,
  ProposeArgs,
  ReadArgs,
  ReleaseArgs,
  ToolError,
} from "./tools";

export { callTool, contractMarkdown, findTool, toolContract } from "./contract";
export type {
  CanvasToolHandler,
  JsonSchemaObject,
  ToolAnnotations,
  ToolContractEntry,
} from "./contract";

export { compileWire, parseWire, printWire } from "./wire/index";
export type { WireDocument } from "./wire/index";

export { generateRoomKey, openEnvelope, sealEnvelope } from "./crypto/index";
export type { Envelope, RoomKey } from "./crypto/index";
