import {
  CanvasStore,
  createCanvasStore,
  type CanvasSnapshot,
  type Command,
  type RecordId,
  type ShapeDef,
} from "@calca/canvas-base";

/** Hard cap on commands accepted by one mutation call. */
export const MAX_OPS_PER_CALL = 100;
/** Soft leases may not outlive 30 s; longer requests are clamped. */
export const MAX_LEASE_TTL_MS = 30_000;

export interface Lease {
  principal: string;
  /** Epoch ms when the lease stops holding. */
  expiresAt: number;
}

/**
 * A recorded mutation proposal. Proposals never mutate the store — a
 * `canvas.apply` of the proposal's commands is how one lands.
 */
export interface Proposal {
  id: string;
  requestId: string;
  principal: string;
  title?: string;
  rationale?: string;
  commands: Command[];
  createdAt: number;
  status: "pending" | "applied" | "rejected";
}

/**
 * Coordination state shared by every principal working on one board.
 * Multiple `CanvasSession`s constructed over the same `SessionShared`
 * simulate several agents (or agent + human) on one store; in Phase 4 a
 * synced store replaces the in-memory one and leases/proposals ride along
 * on the same seam.
 */
export interface SessionShared {
  /** recordId → lease. Expired entries are pruned lazily on access. */
  leases: Map<RecordId, Lease>;
  /** requestIds already seen, for mutation idempotency. */
  seenRequestIds: Set<string>;
  proposals: Proposal[];
}

export const createSessionShared = (): SessionShared => ({
  leases: new Map(),
  seenRequestIds: new Set(),
  proposals: [],
});

export interface CanvasSessionOptions {
  /** Existing store to wrap (e.g. a shared or synced store). */
  store?: CanvasStore;
  /** Snapshot accepted by `CanvasStore.load` — same object `store.snapshot()` returns. */
  snapshot?: CanvasSnapshot;
  /** Principal id stamped on every mutation (`origin: 'agent'`). */
  agentId?: string;
  shared?: SessionShared;
  defs?: ShapeDef[];
  /** Injectable clock (epoch ms) — tests advance it to expire leases. */
  now?: () => number;
}

let sessionCounter = 0;

/**
 * One agent's view onto a `CanvasStore`: principal identity plus the
 * coordination state (leases, request-ID ledger, proposals, selection)
 * the canvas tools enforce against. Runtime-neutral — no Node APIs.
 */
export class CanvasSession {
  readonly store: CanvasStore;
  readonly agentId: string;
  readonly shared: SessionShared;
  /** Records this principal considers selected; drives `canvas.read` scope `selection`. */
  readonly selection: Set<RecordId> = new Set<RecordId>();
  readonly now: () => number;

  constructor(options: CanvasSessionOptions = {}) {
    this.store =
      options.store ?? createCanvasStore({ defs: options.defs, snapshot: options.snapshot });
    if (options.store && options.snapshot) this.store.load(options.snapshot);
    this.agentId = options.agentId ?? `agent-${++sessionCounter}`;
    this.shared = options.shared ?? createSessionShared();
    this.now = options.now ?? Date.now;
  }

  /** Active lease holder for `id`, or null. Expired entries are pruned on read. */
  holderOf(id: RecordId): string | null {
    const lease = this.shared.leases.get(id);
    if (!lease) return null;
    if (lease.expiresAt <= this.now()) {
      this.shared.leases.delete(id);
      return null;
    }
    return lease.principal;
  }

  /** Ids among `ids` currently leased to a principal other than this session's. */
  foreignLeaseIds(ids: Iterable<RecordId>): RecordId[] {
    const blocked: RecordId[] = [];
    for (const id of ids) {
      const holder = this.holderOf(id);
      if (holder !== null && holder !== this.agentId) blocked.push(id);
    }
    return blocked;
  }

  /**
   * Take exclusive soft leases on `ids` for `ttlMs` (clamped to
   * `MAX_LEASE_TTL_MS`). Same-principal leases renew. Returns the ids
   * blocked by other principals, or null on success.
   */
  acquireLeases(ids: readonly RecordId[], ttlMs: number): RecordId[] | null {
    const blocked = this.foreignLeaseIds(ids);
    if (blocked.length > 0) return blocked;
    const expiresAt = this.now() + Math.min(ttlMs, MAX_LEASE_TTL_MS);
    for (const id of ids) {
      this.shared.leases.set(id, { principal: this.agentId, expiresAt });
    }
    return null;
  }

  /** Drop this session's leases on `ids`. Returns how many were released. */
  releaseLeases(ids: readonly RecordId[]): number {
    let released = 0;
    for (const id of ids) {
      if (this.holderOf(id) === this.agentId) {
        this.shared.leases.delete(id);
        released += 1;
      }
    }
    return released;
  }

  /** True when `requestId` has already been seen; marks it seen on first call. */
  claimRequest(requestId: string): boolean {
    if (this.shared.seenRequestIds.has(requestId)) return false;
    this.shared.seenRequestIds.add(requestId);
    return true;
  }

  findProposal(id: string): Proposal | undefined {
    return this.shared.proposals.find((p) => p.id === id);
  }
}

export const createCanvasSession = (options: CanvasSessionOptions = {}): CanvasSession =>
  new CanvasSession(options);
