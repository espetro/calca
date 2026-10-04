import {
  boundsOverlap,
  commandTargets,
  isCommand,
  isShapeRecord,
  type Bounds,
  type CanvasChange,
  type CanvasRecord,
  type Command,
  type Point,
  type RecordId,
  type ShapeRecord,
} from "@calca/canvas-base";

import { MAX_LEASE_TTL_MS, MAX_OPS_PER_CALL, type CanvasSession, type Proposal } from "./session";

export type ErrorCode = "duplicate" | "leased" | "op-limit" | "invalid" | "not-found";

export interface ToolError {
  error: {
    code: ErrorCode;
    message: string;
    ids?: RecordId[];
  };
}

export interface Affected {
  added: RecordId[];
  updated: RecordId[];
  removed: RecordId[];
}

/** Shape every mutation call returns (`applied:false` for proposals/rejections). */
export interface MutationResult {
  applied: boolean;
  commands: Command[];
  affected?: Affected;
  requestId: string;
  reason?: string;
  proposal?: Proposal;
}

const err = (code: ErrorCode, message: string, ids?: RecordId[]): ToolError => ({
  error: { code, message, ...(ids ? { ids } : {}) },
});

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isPoint = (v: unknown): v is Point =>
  isRecord(v) && typeof v.x === "number" && typeof v.y === "number";

const isBounds = (v: unknown): v is Bounds =>
  isRecord(v) &&
  typeof v.x === "number" &&
  typeof v.y === "number" &&
  typeof v.w === "number" &&
  typeof v.h === "number";

const asCommands = (v: unknown): Command[] | null =>
  Array.isArray(v) && v.every(isCommand) ? v : null;

const affectedOf = (change: CanvasChange): Affected => ({
  added: [...change.added],
  updated: [...change.updated],
  removed: [...change.removed],
});

// Shape position/size convention shared with the canvas adapters:
// `props.position: {x, y}` plus `props.width`/`props.height` numbers.
const boundsOf = (record: CanvasRecord): Bounds | null => {
  const p = record.props as { position?: unknown; width?: unknown; height?: unknown };
  if (!isPoint(p.position)) return null;
  return {
    x: p.position.x,
    y: p.position.y,
    w: typeof p.width === "number" ? p.width : 0,
    h: typeof p.height === "number" ? p.height : 0,
  };
};

const summarize = (records: readonly CanvasRecord[]) => {
  const types: Record<string, number> = {};
  const parents: Record<string, RecordId[]> = {};
  let bindings = 0;
  for (const r of records) {
    types[r.type] = (types[r.type] ?? 0) + 1;
    if (isShapeRecord(r)) {
      const key = r.parentId ?? "root";
      (parents[key] ??= []).push(r.id);
    } else {
      bindings += 1;
    }
  }
  return { total: records.length, shapes: records.length - bindings, bindings, types, parents };
};

export interface ReadArgs {
  scope: "summary" | "viewport" | "selection" | "full";
  ids?: RecordId[];
  viewport?: Bounds;
}

export const canvasRead = async (session: CanvasSession, args: ReadArgs): Promise<unknown> => {
  const { scope, ids, viewport } = args;
  if (scope === "viewport" && !isBounds(viewport)) {
    return err("invalid", "scope 'viewport' requires a viewport bounds {x,y,w,h}");
  }
  if (ids !== undefined && !isStringArray(ids)) {
    return err("invalid", "ids must be an array of record ids");
  }

  switch (scope) {
    case "summary": {
      const records = ids ? ids.flatMap((id) => session.store.get(id) ?? []) : session.store.all();
      return summarize(records);
    }
    case "viewport": {
      const records = session.store
        .all()
        .filter((r) => {
          const b = boundsOf(r);
          return b !== null && boundsOverlap(b, viewport as Bounds);
        })
        .filter((r) => !ids || ids.includes(r.id));
      return { records };
    }
    case "selection": {
      const wanted = ids ?? [...session.selection];
      const records = wanted.flatMap((id) => session.store.get(id) ?? []);
      return { ids: records.map((r) => r.id), records };
    }
    case "full": {
      if (ids) {
        return { records: ids.flatMap((id) => session.store.get(id) ?? []) };
      }
      return { snapshot: session.store.snapshot() };
    }
    default:
      return err("invalid", `unknown read scope: ${String(scope)}`);
  }
};

export interface ApplyArgs {
  commands: Command[];
  requestId: string;
  /** Apply a recorded proposal's commands and mark it applied. */
  proposalId?: string;
}

export const canvasApply = async (
  session: CanvasSession,
  args: ApplyArgs,
): Promise<MutationResult | ToolError> => {
  const requestId = args.requestId;
  if (typeof requestId !== "string" || requestId.length === 0) {
    return err("invalid", "requestId is required");
  }

  let commands = asCommands(args.commands);
  let proposal: Proposal | undefined;
  if (args.proposalId !== undefined) {
    proposal = session.findProposal(args.proposalId);
    if (!proposal) return err("not-found", `proposal ${args.proposalId} does not exist`);
    if (proposal.status !== "pending") {
      return err("invalid", `proposal ${proposal.id} is ${proposal.status}`);
    }
    commands = proposal.commands;
  }
  if (!commands) return err("invalid", "commands must be an array of canvas commands");
  if (commands.length === 0) return err("invalid", "commands must not be empty");
  if (commands.length > MAX_OPS_PER_CALL) {
    return err("op-limit", `commands exceed MAX_OPS_PER_CALL (${MAX_OPS_PER_CALL})`);
  }

  // Lease check precedes claimRequest so a rejected attempt doesn't burn the key.
  const blocked = session.foreignLeaseIds(commands.map(commandTargets));
  if (blocked.length > 0) {
    return err("leased", `records leased to another principal: ${blocked.join(", ")}`, blocked);
  }
  if (!session.claimRequest(requestId)) {
    return { applied: false, commands: [], requestId, reason: "duplicate" };
  }

  try {
    const change = session.store.apply(commands, { origin: "agent" });
    if (proposal) proposal.status = "applied";
    return { applied: true, commands: [...commands], affected: affectedOf(change), requestId };
  } catch (error) {
    return err("invalid", error instanceof Error ? error.message : String(error));
  }
};

export interface ProposeArgs {
  commands: Command[];
  requestId: string;
  title?: string;
  rationale?: string;
}

export const canvasPropose = async (
  session: CanvasSession,
  args: ProposeArgs,
): Promise<MutationResult | ToolError> => {
  if (typeof args.requestId !== "string" || args.requestId.length === 0) {
    return err("invalid", "requestId is required");
  }
  const commands = asCommands(args.commands);
  if (!commands) return err("invalid", "commands must be an array of canvas commands");
  if (commands.length === 0) return err("invalid", "commands must not be empty");
  if (commands.length > MAX_OPS_PER_CALL) {
    return err("op-limit", `commands exceed MAX_OPS_PER_CALL (${MAX_OPS_PER_CALL})`);
  }

  if (!session.claimRequest(args.requestId)) {
    return { applied: false, commands: [], requestId: args.requestId, reason: "duplicate" };
  }

  const proposal: Proposal = {
    id: `prop-${crypto.randomUUID()}`,
    requestId: args.requestId,
    principal: session.agentId,
    commands: [...commands],
    createdAt: session.now(),
    status: "pending",
    ...(args.title !== undefined ? { title: args.title } : {}),
    ...(args.rationale !== undefined ? { rationale: args.rationale } : {}),
  };
  session.shared.proposals.push(proposal);
  return { applied: false, commands: [...commands], requestId: args.requestId, proposal };
};

export interface LeaseArgs {
  ids: RecordId[];
  ttlMs: number;
}

export const canvasLease = async (session: CanvasSession, args: LeaseArgs): Promise<unknown> => {
  if (!isStringArray(args.ids) || args.ids.length === 0) {
    return err("invalid", "ids must be a non-empty array of record ids");
  }
  if (typeof args.ttlMs !== "number" || !(args.ttlMs > 0)) {
    return err("invalid", "ttlMs must be a positive number");
  }
  const ttlMs = Math.min(args.ttlMs, MAX_LEASE_TTL_MS);
  const blocked = session.acquireLeases(args.ids, ttlMs);
  if (blocked) {
    return err("leased", `records leased to another principal: ${blocked.join(", ")}`, blocked);
  }
  return {
    leased: [...args.ids],
    ttlMs,
    expiresAt: session.now() + ttlMs,
    clamped: args.ttlMs > MAX_LEASE_TTL_MS,
  };
};

export interface ReleaseArgs {
  ids: RecordId[];
}

export const canvasRelease = async (
  session: CanvasSession,
  args: ReleaseArgs,
): Promise<unknown> => {
  if (!isStringArray(args.ids) || args.ids.length === 0) {
    return err("invalid", "ids must be a non-empty array of record ids");
  }
  return { released: session.releaseLeases(args.ids) };
};

export interface CommentArgs {
  targetId: RecordId;
  text: string;
  requestId?: string;
}

/**
 * Comments are plain `type: 'comment'` shape records — they persist in
 * snapshots and ride the same command pipeline (and, later, Yjs sync) as
 * everything else. `props.target` points at the commented record.
 */
export const canvasComment = async (
  session: CanvasSession,
  args: CommentArgs,
): Promise<MutationResult | ToolError> => {
  if (typeof args.targetId !== "string" || args.targetId.length === 0) {
    return err("invalid", "targetId is required");
  }
  if (typeof args.text !== "string" || args.text.length === 0) {
    return err("invalid", "text is required");
  }
  if (!session.store.get(args.targetId)) {
    return err("not-found", `record ${args.targetId} does not exist`);
  }

  const requestId = args.requestId ?? `comment-${crypto.randomUUID()}`;
  if (!session.claimRequest(requestId)) {
    return { applied: false, commands: [], requestId, reason: "duplicate" };
  }

  const record: ShapeRecord = {
    id: `comment-${crypto.randomUUID()}`,
    type: "comment",
    parentId: null,
    index: session.store.nextIndex(null),
    props: {
      target: args.targetId,
      text: args.text,
      author: session.agentId,
      createdAt: session.now(),
    },
  };
  const commands: Command[] = [{ op: "create-shape", record }];
  const change = session.store.apply(commands, { origin: "agent" });
  return { applied: true, commands, affected: affectedOf(change), requestId };
};

export interface ArrangeArgs {
  ids: RecordId[];
  mode: "row" | "column" | "grid";
  gap?: number;
  requestId?: string;
}

export const canvasArrange = async (
  session: CanvasSession,
  args: ArrangeArgs,
): Promise<MutationResult | ToolError> => {
  if (!isStringArray(args.ids) || args.ids.length < 2) {
    return err("invalid", "ids must be an array of at least two record ids");
  }
  if (args.mode !== "row" && args.mode !== "column" && args.mode !== "grid") {
    return err("invalid", "mode must be 'row', 'column', or 'grid'");
  }
  const gap = typeof args.gap === "number" ? args.gap : 16;

  const shapes: { record: ShapeRecord; bounds: Bounds }[] = [];
  for (const id of args.ids) {
    const record = session.store.get(id);
    if (!record) return err("not-found", `record ${id} does not exist`);
    if (!isShapeRecord(record)) return err("invalid", `record ${id} is not a shape`);
    const bounds = boundsOf(record);
    if (!bounds) return err("invalid", `shape ${id} has no position`);
    shapes.push({ record, bounds });
  }

  const originX = Math.min(...shapes.map((s) => s.bounds.x));
  const originY = Math.min(...shapes.map((s) => s.bounds.y));
  const positions = new Map<RecordId, Point>();

  if (args.mode === "row") {
    const ordered = shapes.toSorted((a, b) => a.bounds.x - b.bounds.x);
    let x = originX;
    for (const s of ordered) {
      positions.set(s.record.id, { x, y: s.bounds.y });
      x += s.bounds.w + gap;
    }
  } else if (args.mode === "column") {
    const ordered = shapes.toSorted((a, b) => a.bounds.y - b.bounds.y);
    let y = originY;
    for (const s of ordered) {
      positions.set(s.record.id, { x: s.bounds.x, y });
      y += s.bounds.h + gap;
    }
  } else {
    const cols = Math.ceil(Math.sqrt(shapes.length));
    const cellW = Math.max(...shapes.map((s) => s.bounds.w)) + gap;
    const cellH = Math.max(...shapes.map((s) => s.bounds.h)) + gap;
    shapes.forEach((s, i) => {
      positions.set(s.record.id, {
        x: originX + (i % cols) * cellW,
        y: originY + Math.floor(i / cols) * cellH,
      });
    });
  }

  const commands: Command[] = [...positions.entries()].map(([id, position]) => ({
    op: "update",
    id,
    props: { position },
  }));

  const blocked = session.foreignLeaseIds(args.ids);
  if (blocked.length > 0) {
    return err("leased", `records leased to another principal: ${blocked.join(", ")}`, blocked);
  }
  const requestId = args.requestId ?? `arrange-${crypto.randomUUID()}`;
  if (!session.claimRequest(requestId)) {
    return { applied: false, commands: [], requestId, reason: "duplicate" };
  }
  const change = session.store.apply(commands, { origin: "agent" });
  return { applied: true, commands, affected: affectedOf(change), requestId };
};
