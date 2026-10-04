import { generateKeyBetween, type Command, type ShapeRecord } from "@calca/canvas-base";
import { describe, expect, it } from "vitest";

import { createCanvasSession, createSessionShared, MAX_LEASE_TTL_MS } from "./session";
import {
  canvasApply,
  canvasLease,
  canvasRelease,
  type MutationResult,
  type ToolError,
} from "./tools";

const isErr = (r: unknown): r is ToolError => typeof r === "object" && r !== null && "error" in r;

const shape = (id: string): ShapeRecord => ({
  id,
  type: "frame",
  parentId: null,
  index: generateKeyBetween(null, null),
  props: { position: { x: 0, y: 0 }, width: 10, height: 10 },
});

const update = (id: string): Command[] => [{ op: "update", id, props: { label: "x" } }];

const makePair = (now: () => number) => {
  const shared = createSessionShared();
  const a = createCanvasSession({ agentId: "a", shared, now });
  const b = createCanvasSession({ store: a.store, agentId: "b", shared, now });
  return { a, b };
};

describe("leases", () => {
  it("blocks a different principal until ttl expiry, allows the holder", async () => {
    let t = 1_000;
    const { a, b } = makePair(() => t);
    await canvasApply(a, {
      commands: [{ op: "create-shape", record: shape("f1") }],
      requestId: "c1",
    });

    const leased = await canvasLease(a, { ids: ["f1"], ttlMs: 5_000 });
    expect(isErr(leased)).toBe(false);

    const blocked = await canvasApply(b, { commands: update("f1"), requestId: "b1" });
    expect(isErr(blocked)).toBe(true);
    expect((blocked as ToolError).error.code).toBe("leased");
    expect((blocked as ToolError).error.ids).toEqual(["f1"]);

    const own = await canvasApply(a, { commands: update("f1"), requestId: "a1" });
    expect(isErr(own)).toBe(false);
    expect((own as MutationResult).applied).toBe(true);

    const stillBlocked = await canvasApply(b, { commands: update("f1"), requestId: "b2" });
    expect((stillBlocked as ToolError).error.code).toBe("leased");

    t += 5_001;
    const freed = await canvasApply(b, { commands: update("f1"), requestId: "b3" });
    expect((freed as MutationResult).applied).toBe(true);
  });

  it("blocks reparent and delete, not just update", async () => {
    const { a, b } = makePair(() => 0);
    await canvasApply(a, {
      commands: [
        { op: "create-shape", record: shape("parent") },
        { op: "create-shape", record: shape("child") },
      ],
      requestId: "seed",
    });
    await canvasLease(a, { ids: ["child"], ttlMs: 10_000 });

    const reparent = await canvasApply(b, {
      commands: [{ op: "reparent", id: "child", parentId: "parent" }],
      requestId: "r1",
    });
    expect((reparent as ToolError).error.code).toBe("leased");

    const del = await canvasApply(b, {
      commands: [{ op: "delete", id: "child" }],
      requestId: "d1",
    });
    expect((del as ToolError).error.code).toBe("leased");
  });

  it("release frees records early; second lease by another principal fails while held", async () => {
    const { a, b } = makePair(() => 0);
    await canvasApply(a, {
      commands: [{ op: "create-shape", record: shape("f") }],
      requestId: "s",
    });
    await canvasLease(a, { ids: ["f"], ttlMs: 30_000 });

    const contested = await canvasLease(b, { ids: ["f"], ttlMs: 30_000 });
    expect((contested as ToolError).error.code).toBe("leased");

    const released = await canvasRelease(a, { ids: ["f"] });
    expect((released as { released: number }).released).toBe(1);

    const nowFree = await canvasLease(b, { ids: ["f"], ttlMs: 30_000 });
    expect(isErr(nowFree)).toBe(false);
  });

  it("clamps ttl above 30s", async () => {
    const { a } = makePair(() => 0);
    const res = await canvasLease(a, { ids: ["x"], ttlMs: 60_000 });
    expect(isErr(res)).toBe(false);
    const out = res as { ttlMs: number; clamped: boolean };
    expect(out.ttlMs).toBe(MAX_LEASE_TTL_MS);
    expect(out.clamped).toBe(true);
  });
});
