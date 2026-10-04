import type { ShapeRecord } from "@calca/canvas-base";
import type { CanvasImage, Comment, DesignIteration, PipelineStatus, Point } from "@calca/shared";

import type { CanvasViews } from "./adapter";

export const DESIGN_FRAME_TYPE = "design-frame";
export const CANVAS_IMAGE_TYPE = "canvas-image";

/** Render context the app hands to `<FlowCanvas data={ctx}>`. */
export interface CalcaCanvasContext {
  isSelectMode: boolean;
  isCommentMode: boolean;
  selectedIds: Set<string>;
  pipelineStages?: Record<string, PipelineStatus>;
  onAddComment: (draft: {
    iterationId: string;
    position: Point;
    screenX: number;
    screenY: number;
  }) => void;
  onClickComment: (comment: Comment, iterationId: string) => void;
}

export const iterationToRecord = (
  iteration: DesignIteration,
  groupId: string,
  index: string,
): ShapeRecord => ({
  id: iteration.id,
  type: DESIGN_FRAME_TYPE,
  parentId: null,
  index,
  props: {
    position: iteration.position,
    width: iteration.width,
    height: iteration.height,
    isLoading: iteration.isLoading,
    groupId,
    iteration,
  },
});

export const imageToRecord = (image: CanvasImage, index: string): ShapeRecord => ({
  id: image.id,
  type: CANVAS_IMAGE_TYPE,
  parentId: null,
  index,
  props: {
    position: image.position,
    width: image.width,
    height: image.height,
    image,
  },
});

const propsPoint = (record: ShapeRecord) => (record.props as { position: Point }).position;

const propsSize = (record: ShapeRecord) => {
  const { width, height } = record.props as { width?: number; height?: number };
  return { width, height };
};

export const calcaViews: CanvasViews<CalcaCanvasContext> = {
  shapes: {
    [DESIGN_FRAME_TYPE]: {
      nodeType: "designFrame",
      position: propsPoint,
      size: (record) => {
        const { width, height, isLoading } = record.props as {
          width?: number;
          height?: number;
          isLoading?: boolean;
        };
        return {
          width: width ?? 480,
          height: isLoading ? 320 : (height ?? 320),
        };
      },
      data: (record, ctx) => {
        const { groupId, iteration } = record.props as {
          groupId: string;
          iteration: DesignIteration;
        };
        return {
          groupId,
          isCommentMode: ctx.isCommentMode,
          isDragging: false,
          isSelectMode: ctx.isSelectMode,
          iteration,
          onAddComment: ctx.onAddComment,
          onClickComment: ctx.onClickComment,
          pipelineStatus: ctx.pipelineStages?.[record.id],
        };
      },
      selected: (record, ctx) => ctx.selectedIds.has(record.id),
      draggable: (_record, ctx) => ctx.isSelectMode,
      selectable: (_record, ctx) => ctx.isSelectMode,
    },
    [CANVAS_IMAGE_TYPE]: {
      nodeType: "canvasImage",
      position: propsPoint,
      size: propsSize,
      data: (record, ctx) => ({
        image: (record.props as { image: CanvasImage }).image,
        isDragging: false,
        isSelectMode: ctx.isSelectMode,
        isSelected: ctx.selectedIds.has(record.id),
      }),
      selected: (record, ctx) => ctx.selectedIds.has(record.id),
      draggable: (_record, ctx) => ctx.isSelectMode,
      selectable: (_record, ctx) => ctx.isSelectMode,
    },
  },
};
