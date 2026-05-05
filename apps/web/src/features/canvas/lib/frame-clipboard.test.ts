import { describe, it, expect } from "vitest";

import { copyFrames, pasteFrames } from "./frame-clipboard";

const POINT = (x: number, y: number) => ({ x, y });

describe("frame-clipboard", () => {
  // ── Minimal mock data ──────────────────────────────────────────────────────

  /** One group, one iteration, one image */
  const makeFixture = () => {
    const imageId = "img-1";
    const groupId = "group-1";
    const iterId = "iter-1";

    const images = [
      {
        id: imageId,
        dataUrl: "data:image/png;base64,abc",
        name: "logo.png",
        width: 100,
        height: 100,
        position: POINT(50, 50),
        thumbnail: "data:image/png;base64,abc",
      },
    ];

    const groups = [
      {
        id: groupId,
        prompt: "a warm landing page",
        iterations: [
          {
            id: iterId,
            html: "<div>Hello</div>",
            label: "v1",
            position: POINT(200, 300),
            width: 800,
            height: 600,
            prompt: "a warm landing page",
            comments: [],
            imageId,
          },
        ],
        position: POINT(200, 300),
        createdAt: 1_000,
      },
    ];

    return { imageId, groupId, iterId, images, groups };
  };

  // ── copyFrames tests ───────────────────────────────────────────────────────

  describe("copyFrames", () => {
    it("returns null when no selections", () => {
      const { groups, images } = makeFixture();
      expect(copyFrames(new Set(), groups, images)).toBeNull();
    });

    it("returns null when selected ids do not match any iteration", () => {
      const { groups, images } = makeFixture();
      expect(copyFrames(new Set(["non-existent"]), groups, images)).toBeNull();
    });

    it("returns ClipboardFramesData when a single iteration is selected", () => {
      const { iterId, groupId, imageId, groups, images } = makeFixture();
      const result = copyFrames(new Set([iterId, imageId]), groups, images);

      expect(result).not.toBeNull();
      expect(result!.type).toBe("frames");
      expect(result!.groups).toHaveLength(1);
      expect(result!.groups[0]!.id).toBe(groupId);
      expect(result!.groups[0]!.iterations).toHaveLength(1);
      expect(result!.groups[0]!.iterations[0]!.id).toBe(iterId);
      expect(result!.images).toHaveLength(1);
      expect(result!.images[0]!.id).toBe(imageId);
    });

    it("computes origin as the top-left of the bounding box", () => {
      const { iterId, imageId, groups, images } = makeFixture();
      // The iteration in makeFixture is at (200, 300)
      const result = copyFrames(new Set([iterId, imageId]), groups, images);
      expect(result!.origin).toEqual(POINT(200, 300));
    });

    it("sets relativePositions for each copied iteration", () => {
      const { iterId, imageId, groups, images } = makeFixture();
      const result = copyFrames(new Set([iterId, imageId]), groups, images);
      // Origin is (200, 300), iter is at (200, 300) → offset is (0, 0)
      expect(result!.relativePositions[iterId]).toEqual(POINT(0, 0));
    });

    it("includes createdAt timestamp", () => {
      const { iterId, imageId, groups, images } = makeFixture();
      const before = Date.now();
      const result = copyFrames(new Set([iterId, imageId]), groups, images);
      const after = Date.now();
      expect(result!.createdAt).toBeGreaterThanOrEqual(before);
      expect(result!.createdAt).toBeLessThanOrEqual(after);
    });
  });

  // ── pasteFrames tests ─────────────────────────────────────────────────────

  describe("pasteFrames", () => {
    it("creates new groups with fresh IDs", () => {
      const { iterId, imageId, groups, images } = makeFixture();
      const clipboardData = copyFrames(new Set([iterId, imageId]), groups, images)!;
      const viewportCenter = POINT(400, 400);

      const { groups: pastedGroups } = pasteFrames(clipboardData, viewportCenter);

      expect(pastedGroups).toHaveLength(1);
      expect(pastedGroups[0]!.id).not.toBe("group-1");
      expect(pastedGroups[0]!.id).toContain("-paste-");
    });

    it("creates new iterations with fresh IDs", () => {
      const { iterId, imageId, groups, images } = makeFixture();
      const clipboardData = copyFrames(new Set([iterId, imageId]), groups, images)!;
      const viewportCenter = POINT(400, 400);

      const { groups: pastedGroups } = pasteFrames(clipboardData, viewportCenter);

      expect(pastedGroups[0]!.iterations[0]!.id).not.toBe("iter-1");
      expect(pastedGroups[0]!.iterations[0]!.id).toContain("-paste-");
    });

    it("does not reuse the original image id", () => {
      const { iterId, imageId, groups, images } = makeFixture();
      const clipboardData = copyFrames(new Set([iterId, imageId]), groups, images)!;
      const viewportCenter = POINT(400, 400);

      const { images: pastedImages } = pasteFrames(clipboardData, viewportCenter);

      expect(pastedImages[0]!.id).not.toBe("img-1");
      expect(pastedImages[0]!.id).toContain("-paste-");
    });

    it("positions the pasted frame at the viewport center (offset by relative position)", () => {
      const { iterId, imageId, groups, images } = makeFixture();
      const clipboardData = copyFrames(new Set([iterId, imageId]), groups, images)!;
      // Viewport center = (400, 400), relative offset = (0, 0) → result = (400, 400)
      const viewportCenter = POINT(400, 400);

      const { groups: pastedGroups } = pasteFrames(clipboardData, viewportCenter);

      expect(pastedGroups[0]!.iterations[0]!.position).toEqual(POINT(400, 400));
    });

    it("transfers the original html to the pasted iteration", () => {
      const { iterId, imageId, groups, images } = makeFixture();
      const clipboardData = copyFrames(new Set([iterId, imageId]), groups, images)!;
      const viewportCenter = POINT(400, 400);

      const { groups: pastedGroups } = pasteFrames(clipboardData, viewportCenter);

      expect(pastedGroups[0]!.iterations[0]!.html).toBe("<div>Hello</div>");
    });

    it("transfers the original prompt to the pasted group", () => {
      const { iterId, imageId, groups, images } = makeFixture();
      const clipboardData = copyFrames(new Set([iterId, imageId]), groups, images)!;
      const viewportCenter = POINT(400, 400);

      const { groups: pastedGroups } = pasteFrames(clipboardData, viewportCenter);

      expect(pastedGroups[0]!.prompt).toBe("a warm landing page");
    });
  });
});
