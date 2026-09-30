import type { CanvasImage } from "@app/shared";
import type { GenerationGroup } from "@app/shared";
import type { Point } from "@app/shared";

/** Frames data stored in the internal Jotai clipboard atom */
export interface ClipboardFramesData {
  type: "frames";
  /** Groups (each group becomes a new group on paste) */
  groups: GenerationGroup[];
  /** Standalone canvas images copied with the frames */
  images: CanvasImage[];
  /** Relative positions (iteration id → {dx, dy} from bounding-box origin) */
  relativePositions: Record<string, Point>;
  /** Bounding-box origin of the original selection */
  origin: Point;
  createdAt: number;
}

/**
 * Serializes selected iterations + their images into the internal clipboard format.
 * Returns null if no iterations were selected.
 */
export function copyFrames(
  selectedIds: Set<string>,
  groups: GenerationGroup[],
  images: CanvasImage[],
): ClipboardFramesData | null {
  if (selectedIds.size === 0) return null;

  const selectedIterationsByGroup = new Map<string, GenerationGroup>();

  for (const group of groups) {
    const selectedIters = group.iterations.filter((iter) => selectedIds.has(iter.id));
    if (selectedIters.length > 0) {
      selectedIterationsByGroup.set(group.id, { ...group, iterations: selectedIters });
    }
  }

  if (selectedIterationsByGroup.size === 0) return null;

  const selectedImages = images.filter((img) => selectedIds.has(img.id));

  let minX = Infinity;
  let minY = Infinity;
  for (const [, group] of selectedIterationsByGroup) {
    for (const iter of group.iterations) {
      if (iter.position.x < minX) minX = iter.position.x;
      if (iter.position.y < minY) minY = iter.position.y;
    }
  }
  const origin: Point = { x: minX, y: minY };

  const relativePositions: Record<string, Point> = {};
  for (const [, group] of selectedIterationsByGroup) {
    for (const iter of group.iterations) {
      relativePositions[iter.id] = {
        x: iter.position.x - origin.x,
        y: iter.position.y - origin.y,
      };
    }
  }

  return {
    type: "frames",
    groups: Array.from(selectedIterationsByGroup.values()),
    images: selectedImages,
    relativePositions,
    origin,
    createdAt: Date.now(),
  };
}

/**
 * Deserializes clipboard data and returns new groups + images positioned at viewportCenter.
 * Assigns fresh unique IDs to all created entities.
 */
export function pasteFrames(
  clipboardData: ClipboardFramesData,
  viewportCenter: Point,
): { groups: GenerationGroup[]; images: CanvasImage[] } {
  const now = Date.now();
  const newGroups: GenerationGroup[] = [];
  const newImages: CanvasImage[] = [];

  for (const group of clipboardData.groups) {
    const newGroupId = `${group.id}-paste-${now}`;
    const newIterations = group.iterations.map((iter) => {
      const rel = clipboardData.relativePositions[iter.id] ?? { x: 0, y: 0 };
      return {
        ...iter,
        id: `${iter.id}-paste-${now}`,
        position: {
          x: viewportCenter.x + rel.x,
          y: viewportCenter.y + rel.y,
        },
      };
    });

    newGroups.push({
      ...group,
      id: newGroupId,
      iterations: newIterations,
      createdAt: now,
    });

    for (const img of clipboardData.images) {
      const rel = clipboardData.relativePositions[img.id] ?? { x: 0, y: 0 };
      newImages.push({
        ...img,
        id: `${img.id}-paste-${now}`,
        position: {
          x: viewportCenter.x + rel.x,
          y: viewportCenter.y + rel.y,
        },
      });
    }
  }

  return { groups: newGroups, images: newImages };
}

export function cutFrames(
  selectedIds: Set<string>,
  groups: GenerationGroup[],
  images: CanvasImage[],
): {
  clipboardData: ClipboardFramesData | null;
  groups: GenerationGroup[];
  images: CanvasImage[];
} {
  const clipboardData = copyFrames(selectedIds, groups, images);

  const updatedGroups = groups
    .map((g) => ({
      ...g,
      iterations: g.iterations.filter((iter) => !selectedIds.has(iter.id)),
    }))
    .filter((g) => g.iterations.length > 0);

  const updatedImages = images.filter((img) => !selectedIds.has(img.id));

  return {
    clipboardData,
    groups: updatedGroups,
    images: updatedImages,
  };
}
