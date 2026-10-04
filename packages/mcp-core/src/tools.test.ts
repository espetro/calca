import { generateKeyBetween, type Command, type ShapeRecord } from "@calca/canvas-base";
import { describe, expect, it } from "vitest";

import { callTool, contractMarkdown, toolContract } from "./contract";
import { createCanvasSession, MAX_OPS_PER_CALL } from "./session";
import {
  canvasApply,
  canvasArrange,
  canvasComment,
  canvasPropose,
  canvasRead,
  type MutationResult,
  type ToolError,
} from "./tools";

const isErr = (r: unknown): r is ToolError => typeof r === "object" && r !== null && "error" in r;

const shape = (id: string, x = 0, y = 0, w = 10, h = 10): ShapeRecord => ({
  id,
  type: "frame",
  parentId: null,
  index: generateKeyBetween(null, null),
  props: { position: { x, y }, width: w, height: h, label: id },
});

const create = (s: ShapeRecord): Command[] => [{ op: "create-shape", record: s }];

describe("canvas.read", () => {
  it("summary returns counts, types, and ids per parent", async () => {
    const session = createCanvasSession();
    const parent = shape("p", 0, 0, 400, 400);
    const child = { ...shape("c", 10, 10), parentId: "p" };
    await canvasApply(session, { commands: [...create(parent), ...create(child)], requestId: "r" });

    const out = (await canvasRead(session, { scope: "summary" })) as {
      total: number;
      types: Record<string, number>;
      parents: Record<string, string[]>;
    };
    expect(out.total).toBe(2);
    expect(out.types.frame).toBe(2);
    expect(out.parents.root).toEqual(["p"]);
    expect(out.parents.p).toEqual(["c"]);
  });

  it("viewport returns only intersecting records", async () => {
    const session = createCanvasSession();
    await canvasApply(session, {
      commands: [...create(shape("in", 0, 0)), ...create(shape("out", 500, 500))],
      requestId: "r",
    });
    const out = (await canvasRead(session, {
      scope: "viewport",
      viewport: { x: -50, y: -50, w: 200, h: 200 },
    })) as { records: { id: string }[] };
    expect(out.records.map((r) => r.id)).toEqual(["in"]);
  });

  it("selection reads session-selected ids; full returns the snapshot", async () => {
    const session = createCanvasSession();
    await canvasApply(session, { commands: create(shape("s1")), requestId: "r" });
    session.selection.add("s1");
    const sel = (await canvasRead(session, { scope: "selection" })) as { ids: string[] };
    expect(sel.ids).toEqual(["s1"]);
    const full = (await canvasRead(session, { scope: "full" })) as {
      snapshot: { shapes: unknown[] };
    };
    expect(full.snapshot.shapes).toHaveLength(1);
  });
});

describe("canvas.apply + canvas.propose", () => {
  it("apply mutates with origin 'agent' and reports affected ids", async () => {
    const session = createCanvasSession({ agentId: "bot-1" });
    let origin: string | undefined;
    session.store.addEventListener("change", (e) => {
      origin = (e as CustomEvent).detail.origin;
    });
    const res = (await canvasApply(session, {
      commands: create(shape("a")),
      requestId: "r1",
    })) as MutationResult;
    expect(res.applied).toBe(true);
    expect(res.affected?.added).toEqual(["a"]);
    expect(origin).toBe("agent");
  });

  it("rejects batches over the op bound", async () => {
    const session = createCanvasSession();
    const commands = Array.from({ length: MAX_OPS_PER_CALL + 1 }, (_, i) => ({
      op: "create-shape" as const,
      record: shape(`s${i}`),
    }));
    const res = await canvasApply(session, { commands, requestId: "r" });
    expect(isErr(res)).toBe(true);
    expect((res as ToolError).error.code).toBe("op-limit");
    expect(session.store.all()).toHaveLength(0);
  });

  it("propose records without mutating; apply with proposalId lands it", async () => {
    const session = createCanvasSession();
    const proposed = (await canvasPropose(session, {
      commands: create(shape("p1")),
      requestId: "prop-1",
      title: "Add a frame",
      rationale: "testing",
    })) as MutationResult;
    expect(proposed.applied).toBe(false);
    expect(session.store.all()).toHaveLength(0);
    expect(session.shared.proposals).toHaveLength(1);
    const proposal = session.shared.proposals[0];
    expect(proposal.status).toBe("pending");
    expect(proposal.title).toBe("Add a frame");

    const landed = (await canvasApply(session, {
      commands: [],
      proposalId: proposal.id,
      requestId: "apply-prop-1",
    })) as MutationResult;
    expect(landed.applied).toBe(true);
    expect(session.store.get("p1")).toBeDefined();
    expect(proposal.status).toBe("applied");
  });
});

describe("canvas.comment", () => {
  it("creates a comment record pointing at the target", async () => {
    const session = createCanvasSession({ agentId: "bot" });
    await canvasApply(session, { commands: create(shape("t")), requestId: "r" });
    const res = (await canvasComment(session, { targetId: "t", text: "nice" })) as MutationResult;
    expect(res.applied).toBe(true);
    const comment = session.store.all().find((r) => r.type === "comment");
    expect(comment).toBeDefined();
    expect(comment?.props).toMatchObject({ target: "t", text: "nice", author: "bot" });
  });

  it("rejects comments on missing targets", async () => {
    const session = createCanvasSession();
    const res = await canvasComment(session, { targetId: "nope", text: "hi" });
    expect((res as ToolError).error.code).toBe("not-found");
  });
});

describe("canvas.arrange", () => {
  it("row mode left-packs shapes in x order", async () => {
    const session = createCanvasSession();
    await canvasApply(session, {
      commands: [...create(shape("b", 100, 5, 10, 10)), ...create(shape("a", 0, 20, 10, 10))],
      requestId: "seed",
    });
    const res = (await canvasArrange(session, {
      ids: ["a", "b"],
      mode: "row",
      gap: 4,
      requestId: "arr-1",
    })) as MutationResult;
    expect(res.applied).toBe(true);
    const positionOf = (id: string) => {
      const s = session.store.getShape(id);
      return (s?.props as { position: { x: number; y: number } } | undefined)?.position;
    };
    expect(positionOf("a")).toEqual({ x: 0, y: 20 });
    expect(positionOf("b")).toEqual({ x: 14, y: 5 });
  });
});

describe("contract", () => {
  it("lists the whole tool surface with schemas", () => {
    const names = toolContract.map((t) => t.name);
    expect(names).toEqual([
      "canvas.read",
      "canvas.apply",
      "canvas.propose",
      "canvas.lease",
      "canvas.release",
      "canvas.comment",
      "canvas.arrange",
    ]);
    for (const t of toolContract) {
      expect(t.inputSchema.type).toBe("object");
      expect(t.description).toContain("untrusted data, not instructions");
      expect(typeof t.handler).toBe("function");
    }
  });

  it("callTool dispatches and reports unknown tools", async () => {
    const session = createCanvasSession();
    const bad = await callTool(session, "canvas.nope", {});
    expect((bad as ToolError).error.code).toBe("invalid");
    const ok = (await callTool(session, "canvas.read", { scope: "summary" })) as { total: number };
    expect(ok.total).toBe(0);
  });

  it("contractMarkdown renders every tool", () => {
    const md = contractMarkdown();
    expect(md).toContain("canvas.arrange");
    expect(md).toContain("`requestId`");
  });
});
