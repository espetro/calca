import { generateKeyBetween, type Command, type ShapeRecord } from "@calca/canvas-base";
import { describe, expect, it } from "vitest";

import { createCanvasSession, createSessionShared } from "./session";
import { canvasApply, canvasPropose, type MutationResult, type ToolError } from "./tools";

/** Deterministic PRNG (mulberry32) — property tests must not depend on Math.random. */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const isErr = (r: MutationResult | ToolError): r is ToolError => "error" in r;

const shape = (id: string, rand: () => number): ShapeRecord => ({
  id,
  type: "frame",
  parentId: null,
  index: generateKeyBetween(null, null),
  props: {
    position: { x: Math.floor(rand() * 10_000), y: Math.floor(rand() * 10_000) },
    width: 100,
    height: 100,
    label: id,
  },
});

describe("request-ID idempotency (property)", () => {
  it("replaying the same requestId never double-applies, across random batches", async () => {
    const rand = mulberry32(0xcafe);
    const session = createCanvasSession({ agentId: "agent-a" });

    const live: string[] = [];
    for (let iter = 0; iter < 60; iter += 1) {
      const n = 1 + Math.floor(rand() * 8);
      const commands: Command[] = [];
      for (let i = 0; i < n; i += 1) {
        const choice = rand();
        if (choice < 0.6 || live.length === 0) {
          const id = `s-${iter}-${i}`;
          commands.push({ op: "create-shape", record: shape(id, rand) });
          live.push(id);
        } else {
          const idx = Math.floor(rand() * live.length);
          const id = live[idx];
          if (choice < 0.85) {
            commands.push({ op: "update", id, props: { label: `u-${iter}-${i}` } });
          } else {
            commands.push({ op: "delete", id });
            live.splice(idx, 1);
          }
        }
      }

      const requestId = `req-${iter}`;
      const before = session.store.all().length;
      // oxlint-disable-next-line no-await-in-loop -- sequential applies are the point of the test
      const first = await canvasApply(session, { commands, requestId });
      if (isErr(first)) throw new Error(`unexpected error: ${first.error.message}`);
      const applied = session.store.all().length - before;

      // Replay 1–3 times; every replay is a no-op.
      const replays = 1 + Math.floor(rand() * 3);
      for (let r = 0; r < replays; r += 1) {
        // oxlint-disable-next-line no-await-in-loop -- replays must run in order
        const replay = await canvasApply(session, { commands, requestId });
        if (isErr(replay)) throw new Error(`unexpected error: ${replay.error.message}`);
        expect(replay.applied).toBe(false);
        expect(replay.reason).toBe("duplicate");
      }
      expect(session.store.all().length).toBe(before + applied);
    }
  });

  it("dedupes propose replays too", async () => {
    const session = createCanvasSession();
    const args = {
      commands: [{ op: "create-shape", record: shape("x", mulberry32(1)) }] as Command[],
      requestId: "p-1",
    };
    const first = await canvasPropose(session, args);
    const second = await canvasPropose(session, args);
    expect(isErr(first)).toBe(false);
    expect(isErr(second)).toBe(false);
    expect((second as MutationResult).reason).toBe("duplicate");
    expect(session.shared.proposals).toHaveLength(1);
  });

  it("request ids are shared across sessions on one board", async () => {
    const shared = createSessionShared();
    const a = createCanvasSession({ shared, agentId: "a" });
    const b = createCanvasSession({ shared, store: a.store, agentId: "b" });
    const commands: Command[] = [{ op: "create-shape", record: shape("only-once", mulberry32(2)) }];
    await canvasApply(a, { commands, requestId: "shared-1" });
    const replay = await canvasApply(b, { commands, requestId: "shared-1" });
    expect((replay as MutationResult).applied).toBe(false);
    expect(a.store.all()).toHaveLength(1);
  });
});
