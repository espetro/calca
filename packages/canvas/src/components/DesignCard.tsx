import type { Comment as CommentType, DesignIteration, Point } from "@app/shared";

import { DesignFrame, DEFAULT_FRAME_WIDTH } from "./DesignFrame";

export { DEFAULT_FRAME_WIDTH } from "./DesignFrame";

interface DesignCardProps {
  iteration: DesignIteration;
  isCommentMode: boolean;
  isSelectMode: boolean;
  isDragging: boolean;
  isSelected?: boolean;
  onSelect?: (e?: React.MouseEvent) => void;
  onAddComment: (iterationId: string, position: Point, screenX: number, screenY: number) => void;
  onClickComment: (comment: CommentType, iterationId: string) => void;
  onDragStart: (e: React.MouseEvent) => void;
  scale: number;
}

export function DesignCard({
  iteration,
  isCommentMode,
  isSelectMode,
  isDragging,
  isSelected,
  onSelect,
  onAddComment,
  onClickComment,
  onDragStart,
  scale,
}: DesignCardProps) {
  return (
    <div
      className={`absolute ${isDragging ? "z-50" : ""}`}
      style={{
        left: iteration.position.x,
        top: iteration.position.y,
        width: iteration.width || DEFAULT_FRAME_WIDTH,
      }}
    >
      <div className="mb-2 flex items-center gap-2 group/label">
        <span className="text-xs font-medium text-gray-500/80 bg-white/60 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-white/40">
          {iteration.label}
        </span>
      </div>

      <DesignFrame
        iteration={iteration}
        isCommentMode={isCommentMode}
        isSelectMode={isSelectMode}
        isSelected={isSelected}
        isDragging={isDragging}
        scale={scale}
        onClick={(e) => {
          if (isSelectMode && onSelect) {
            e.stopPropagation();
            onSelect(e);
          }
        }}
        onMouseDown={(e) => {
          if (isSelectMode) {
            e.stopPropagation();
            onDragStart(e);
          }
        }}
        onAddComment={(iterationId, position, screenX, screenY) =>
          onAddComment(iterationId, position, screenX, screenY)
        }
        onClickComment={onClickComment}
      />
    </div>
  );
}
