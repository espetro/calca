import type { Comment as CommentType, DesignIteration, PipelineStatus } from "@app/shared";
import { useViewport, type Node, type NodeProps } from "@xyflow/react";

import { DesignFrame, DEFAULT_FRAME_WIDTH } from "../DesignFrame";
import { PipelineStatusOverlay } from "../PipelineStatusOverlay";

export type DesignFrameNodeData = {
  iteration: DesignIteration;
  groupId: string;
  isCommentMode: boolean;
  isSelectMode: boolean;
  isDragging: boolean;
  pipelineStatus?: PipelineStatus;
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
  const { iteration, isCommentMode, isSelectMode, pipelineStatus, onAddComment, onClickComment } =
    data;
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
  const frameHeight = iteration.isLoading ? 320 : iteration.height || 320;

  return (
    <div style={{ width: frameWidth }}>
      <div className="mb-2 flex items-center gap-2 group/label pointer-events-none">
        <span className="text-xs font-medium text-gray-500/80 bg-white/60 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-white/40">
          {iteration.label}
        </span>
      </div>

      <DesignFrame
        iteration={iteration}
        width={frameWidth}
        isCommentMode={isCommentMode}
        isSelectMode={isSelectMode}
        isDragging={data.isDragging}
        isSelected={selected}
        scale={zoom}
        onAddComment={handleAddComment}
        onClickComment={onClickComment}
      />

      {pipelineStatus && pipelineStatus.stage !== "done" && (
        <PipelineStatusOverlay
          status={pipelineStatus}
          x={0}
          y={0}
          width={frameWidth}
          frameHeight={frameHeight}
        />
      )}
    </div>
  );
}
