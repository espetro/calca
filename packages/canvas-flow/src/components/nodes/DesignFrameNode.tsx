import { DesignFrame, DEFAULT_FRAME_WIDTH, PipelineStatusOverlay } from "@calca/canvas-ui";
import type { FrameEnv } from "@calca/format/browser";
import type { Comment as CommentType, DesignIteration, PipelineStatus } from "@calca/shared";
import { useViewport, type Node, type NodeProps } from "@xyflow/react";

export type DesignFrameNodeData = {
  iteration: DesignIteration;
  groupId: string;
  isCommentMode: boolean;
  isSelectMode: boolean;
  isDragging: boolean;
  pipelineStatus?: PipelineStatus;
  errorTitle?: string;
  errorHint?: string;
  /** Resolved frame environment (output-format driven rendering). */
  frameEnv?: FrameEnv;
  /** Per-frame CSS appended last (requires frameEnv.customCssPassthrough). */
  customCss?: string;
  onAddComment: (draft: {
    iterationId: string;
    position: { x: number; y: number };
    screenX: number;
    screenY: number;
  }) => void;
  onClickComment: (comment: CommentType, iterationId: string) => void;
};

export type DesignFrameNodeType = Node<DesignFrameNodeData, "designFrame">;

export function DesignFrameNode({ data, selected }: NodeProps<DesignFrameNodeType>) {
  const {
    iteration,
    isCommentMode,
    isSelectMode,
    pipelineStatus,
    onAddComment,
    onClickComment,
    frameEnv,
    customCss,
  } = data;
  const { zoom } = useViewport();

  const handleAddComment = (
    iterationId: string,
    position: { x: number; y: number },
    screenX: number,
    screenY: number,
  ) => {
    onAddComment({ iterationId, position, screenX, screenY });
  };

  const frameWidth = iteration.width || DEFAULT_FRAME_WIDTH;

  return (
    <div style={{ width: frameWidth }}>
      <div className="mb-2 flex items-center gap-2 group/label pointer-events-none">
        <span className="text-xs font-medium bg-card/70 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-border/50 text-muted-foreground">
          {iteration.label}
        </span>
      </div>

      <div className="relative">
        <DesignFrame
          iteration={iteration}
          width={frameWidth}
          isCommentMode={isCommentMode}
          isSelectMode={isSelectMode}
          isDragging={data.isDragging}
          isSelected={selected}
          scale={zoom}
          errorTitle={data.errorTitle}
          errorHint={data.errorHint}
          frameEnv={frameEnv}
          customCss={customCss}
          onAddComment={handleAddComment}
          onClickComment={onClickComment}
        />

        {pipelineStatus && pipelineStatus.stage !== "done" && (
          <PipelineStatusOverlay status={pipelineStatus} />
        )}
      </div>
    </div>
  );
}
