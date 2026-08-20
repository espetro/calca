import type { CanvasImage } from "@app/shared";
import type { Node, NodeProps } from "@xyflow/react";

export type CanvasImageNodeData = {
  image: CanvasImage;
  isSelectMode: boolean;
  isDragging: boolean;
  isSelected: boolean;
};

export type CanvasImageNodeType = Node<CanvasImageNodeData, "canvasImage">;

export function CanvasImageNode({ data }: NodeProps<CanvasImageNodeType>) {
  const { image, isSelectMode, isDragging, isSelected } = data;

  return (
    <div
      className={`group w-full h-full rounded-lg overflow-hidden shadow-md transition-shadow ${
        isSelected
          ? "ring-2 ring-blue-500 border-blue-400/50 shadow-lg"
          : "border border-white/40 hover:shadow-lg"
      } ${
        isSelectMode
          ? isDragging
            ? "cursor-grabbing shadow-xl ring-2 ring-blue-400/30"
            : "cursor-grab"
          : ""
      }`}
    >
      <img
        src={image.dataUrl}
        alt={image.name}
        className="w-full h-full object-cover"
        draggable={false}
      />
      <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white bg-black/50 rounded px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
        {image.name}
      </span>
    </div>
  );
}
