import { describe, expect, it } from "vitest";

import { callTool } from "./contract";
import { createCanvasSession } from "./session";
import { canvasShowVariations, MAX_VARIATIONS, type MutationResult, type ToolError } from "./tools";

const isErr = (r: unknown): r is ToolError => typeof r === "object" && r !== null && "error" in r;

const variations = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    label: `v${i}`,
    html: `<div>${i}</div>`,
    width: 100,
    height: 50,
  }));

const positions = (session: ReturnType<typeof createCanvasSession>, frameIds: string[]) =>
  frameIds.map((id) => {
    const shape = session.store.getShape(id);
    return (shape?.props as { position: { x: number; y: number } } | undefined)?.position;
  });

describe("canvas.show_variations", () => {
  it("row layout accumulates x by width + gap", async () => {
    const session = createCanvasSession();
    const res = (await canvasShowVariations(session, {
      title: "Hero concepts",
      variations: variations(3),
      layout: "row",
      gap: 20,
      requestId: "sv-1",
    })) as MutationResult & { frameIds: string[]; groupId: string };

    expect(res.applied).toBe(true);
    expect(res.frameIds).toHaveLength(3);
    expect(res.groupId).toMatch(/^group-/);
    expect(positions(session, res.frameIds)).toEqual([
      { x: 0, y: 0 },
      { x: 120, y: 0 },
      { x: 240, y: 0 },
    ]);
  });

  it("column layout accumulates y by height + gap", async () => {
    const session = createCanvasSession();
    const res = (await canvasShowVariations(session, {
      title: "Stacked",
      variations: variations(2),
      layout: "column",
      gap: 10,
      requestId: "sv-col",
    })) as MutationResult & { frameIds: string[] };

    expect(positions(session, res.frameIds)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 60 },
    ]);
  });

  it("grid layout packs into a square-ish grid", async () => {
    const session = createCanvasSession();
    const res = (await canvasShowVariations(session, {
      title: "Grid",
      variations: variations(4),
      layout: "grid",
      gap: 10,
      viewport: { x: 100, y: 200 },
      requestId: "sv-grid",
    })) as MutationResult & { frameIds: string[] };

    // cols = ceil(sqrt(4)) = 2, cell = max width + gap
    expect(positions(session, res.frameIds)).toEqual([
      { x: 100, y: 200 },
      { x: 210, y: 200 },
      { x: 100, y: 260 },
      { x: 210, y: 260 },
    ]);
  });

  it("rejects more than the variation cap", async () => {
    const session = createCanvasSession();
    const res = await canvasShowVariations(session, {
      title: "Too many",
      variations: variations(MAX_VARIATIONS + 1),
      requestId: "sv-cap",
    });
    expect(isErr(res)).toBe(true);
    expect((res as ToolError).error.code).toBe("invalid");
    expect(session.store.all()).toHaveLength(0);
  });

  it("reuses the requestId as an idempotency key", async () => {
    const session = createCanvasSession();
    const first = (await canvasShowVariations(session, {
      title: "Once",
      variations: variations(1),
      requestId: "sv-dup",
    })) as MutationResult & { frameIds: string[] };
    expect(first.applied).toBe(true);

    const second = (await canvasShowVariations(session, {
      title: "Once",
      variations: variations(1),
      requestId: "sv-dup",
    })) as MutationResult & { frameIds: string[] };
    expect(second.applied).toBe(false);
    expect(second.reason).toBe("duplicate");
    expect(session.store.all()).toHaveLength(1);
  });

  it("creates design-frame records with a shared groupId and iteration payload", async () => {
    const session = createCanvasSession();
    const res = (await canvasShowVariations(session, {
      title: "Landing heroes",
      variations: [{ label: "A", html: "<div>one</div>" }],
      requestId: "sv-frame",
    })) as MutationResult & { frameIds: string[]; groupId: string };

    const record = session.store.get(res.frameIds[0]);
    expect(record?.type).toBe("design-frame");
    const props = record?.props as {
      position: { x: number; y: number };
      width: number;
      height: number;
      isLoading: boolean;
      groupId: string;
      iteration: { id: string; label: string; html: string; comments: unknown[] };
    };
    expect(props.groupId).toBe(res.groupId);
    expect(props.isLoading).toBe(false);
    expect(props.width).toBe(480);
    expect(props.height).toBe(320);
    expect(props.iteration.label).toBe("A");
    expect(props.iteration.html).toBe("<div>one</div>");
    expect(props.iteration.comments).toEqual([]);
  });

  it("emits commands that land unchanged through the propose + apply flow", async () => {
    const session = createCanvasSession();
    const res = (await canvasShowVariations(session, {
      title: "Proposed",
      variations: variations(2),
      requestId: "sv-prop",
    })) as MutationResult & { frameIds: string[] };

    // The composite emits plain create-shape commands, so they can be handed
    // to the proposal flow verbatim on another board.
    const other = createCanvasSession();
    const { canvasPropose, canvasApply } = await import("./tools");
    const proposed = (await canvasPropose(other, {
      commands: res.commands,
      requestId: "sv-prop-2",
      title: "Proposed",
    })) as MutationResult;
    expect(proposed.applied).toBe(false);

    const landed = (await canvasApply(other, {
      commands: [],
      proposalId: proposed.proposal!.id,
      requestId: "sv-prop-3",
    })) as MutationResult;
    expect(landed.applied).toBe(true);
    for (const id of res.frameIds) {
      expect(other.store.get(id)).toBeDefined();
    }
  });

  it("is dispatched by the contract", async () => {
    const session = createCanvasSession();
    const res = (await callTool(session, "canvas.show_variations", {
      title: "Via contract",
      variations: variations(1),
      requestId: "sv-contract",
    })) as MutationResult & { frameIds: string[] };
    expect(res.applied).toBe(true);
    expect(res.frameIds).toHaveLength(1);
  });
});
