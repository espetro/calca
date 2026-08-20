import type {
  CanvasImage,
  Comment,
  GenerationGroup,
  PipelineStatus,
  Point,
  ToolMode,
} from "@app/shared";
import {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeChange,
  Panel,
  ReactFlow,
  SelectionMode,
  applyNodeChanges,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CanvasHandle } from "../hooks/use-canvas";
import { CanvasImageNode, type CanvasImageNodeType } from "./nodes/CanvasImageNode";
import { DesignFrameNode, type DesignFrameNodeType } from "./nodes/DesignFrameNode";

const DEFAULT_FRAME_HEIGHT = 320;
const DEFAULT_FRAME_WIDTH = 480;

type RubberBand = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null;

type Updater<T> = T | ((prev: T) => T);

interface CanvasAreaProps {
  /** @deprecated CanvasArea now uses React Flow's native viewport; this prop is kept for API compatibility. */
  canvas: CanvasHandle;
  groups: GenerationGroup[];
  onGroupsChange: (update: Updater<GenerationGroup[]>) => void;
  canvasImages: CanvasImage[];
  onCanvasImagesChange: (update: Updater<CanvasImage[]>) => void;
  selectedIds: Set<string>;
  onSelectedIdsChange: (update: Updater<Set<string>>) => void;
  toolMode: ToolMode;
  spaceHeld: boolean;
  /** @deprecated Rubber-band selection is handled by React Flow's built-in selection mode. */
  rubberBand?: RubberBand;
  /** @deprecated Rubber-band selection is handled by React Flow's built-in selection mode. */
  setRubberBand?: (update: Updater<RubberBand>) => void;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  draggingImageId: string | null;
  setDraggingImageId: (id: string | null) => void;
  pipelineStages?: Record<string, PipelineStatus>;
  onAddComment: (draft: {
    iterationId: string;
    position: Point;
    screenX: number;
    screenY: number;
  }) => void;
  onClickComment: (comment: Comment, iterationId: string) => void;
  onImageDrop?: (files: File[], dropX?: number, dropY?: number) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: React.ReactNode;
}

const nodeTypes = {
  canvasImage: CanvasImageNode,
  designFrame: DesignFrameNode,
};

export const CanvasArea = ({
  groups,
  onGroupsChange,
  canvasImages,
  onCanvasImagesChange,
  selectedIds,
  onSelectedIdsChange,
  toolMode,
  spaceHeld,
  draggingId: _draggingId,
  setDraggingId,
  draggingImageId: _draggingImageId,
  setDraggingImageId,
  pipelineStages,
  onAddComment,
  onClickComment,
  onImageDrop,
  onContextMenu,
  emptyTitle,
  emptyDescription,
  toolbar,
}: CanvasAreaProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges] = useState<Edge[]>([]);

  const isSelectMode = toolMode === "select" && !spaceHeld;
  const isCommentMode = toolMode === "comment" && !spaceHeld;

  const allIterations = useMemo(
    () => groups.flatMap((g) => g.iterations.map((iter) => ({ ...iter, groupId: g.id }))),
    [groups],
  );

  const nextNodes = useMemo((): Node[] => {
    const frameNodes: DesignFrameNodeType[] = allIterations.map((iteration) => ({
      id: iteration.id,
      type: "designFrame",
      position: { ...iteration.position },
      width: iteration.width || DEFAULT_FRAME_WIDTH,
      height: iteration.isLoading ? DEFAULT_FRAME_HEIGHT : iteration.height || DEFAULT_FRAME_HEIGHT,
      data: {
        groupId: iteration.groupId,
        isCommentMode,
        isDragging: false,
        isSelectMode,
        iteration,
        onAddComment,
        onClickComment,
        pipelineStatus: pipelineStages?.[iteration.id],
      },
      selected: selectedIds.has(iteration.id),
      selectable: isSelectMode,
      draggable: isSelectMode,
    }));

    const imageNodes: CanvasImageNodeType[] = canvasImages.map((image) => ({
      id: image.id,
      type: "canvasImage",
      position: { ...image.position },
      width: image.width,
      height: image.height,
      data: {
        image,
        isDragging: false,
        isSelectMode,
        isSelected: selectedIds.has(image.id),
      },
      selected: selectedIds.has(image.id),
      selectable: isSelectMode,
      draggable: isSelectMode,
    }));

    return [...frameNodes, ...imageNodes];
  }, [
    allIterations,
    canvasImages,
    isCommentMode,
    isSelectMode,
    onAddComment,
    onClickComment,
    pipelineStages,
    selectedIds,
  ]);

  useEffect(() => {
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      return nextNodes.map((n) => {
        const existing = byId.get(n.id);
        if (existing) {
          // Preserve React Flow's transient drag/selection state while refreshing data.
          return {
            ...n,
            position: existing.position,
            selected: existing.selected,
            data: {
              ...n.data,
              isDragging: existing.data?.isDragging ?? false,
              scale: existing.data?.scale ?? 1,
            },
          };
        }
        return n;
      });
    });
  }, [nextNodes]);

  const updatePositionsFromChanges = useCallback(
    (changes: NodeChange[]) => {
      const positionUpdates = new Map<string, Point>();
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          positionUpdates.set(change.id, { ...change.position });
        }
      }

      if (positionUpdates.size === 0) return;

      onGroupsChange((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          iterations: group.iterations.map((iter) => {
            const update = positionUpdates.get(iter.id);
            return update ? { ...iter, position: update } : iter;
          }),
        })),
      );

      onCanvasImagesChange((prevImages) =>
        prevImages.map((img) => {
          const update = positionUpdates.get(img.id);
          return update ? { ...img, position: update } : img;
        }),
      );
    },
    [onGroupsChange, onCanvasImagesChange],
  );

  const updateSelectionFromChanges = useCallback(
    (changes: NodeChange[]) => {
      const selectionChanges = new Map<string, boolean>();
      for (const change of changes) {
        if (change.type === "select") {
          selectionChanges.set(change.id, change.selected);
        }
      }

      if (selectionChanges.size === 0) return;

      onSelectedIdsChange((prev) => {
        const next = new Set(prev);
        for (const [id, selected] of selectionChanges) {
          if (selected) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
        return next;
      });
    },
    [onSelectedIdsChange],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((prev) => applyNodeChanges(changes, prev));
      updatePositionsFromChanges(changes);
      updateSelectionFromChanges(changes);
    },
    [updatePositionsFromChanges, updateSelectionFromChanges],
  );

  const onNodeDragStart = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      const isImage = canvasImages.some((img) => img.id === node.id);
      if (isImage) {
        setDraggingImageId(node.id);
      } else {
        setDraggingId(node.id);
      }
    },
    [canvasImages, setDraggingId, setDraggingImageId],
  );

  const onNodeDragStop = useCallback(() => {
    setDraggingId(null);
    setDraggingImageId(null);
  }, [setDraggingId, setDraggingImageId]);

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      const ids = new Set(selectedNodes.map((n) => n.id));
      onSelectedIdsChange(ids);
    },
    [onSelectedIdsChange],
  );

  const onPaneClick = useCallback(() => {
    onSelectedIdsChange(new Set());
  }, [onSelectedIdsChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
      if (files.length > 0 && onImageDrop) {
        onImageDrop(files, e.clientX, e.clientY);
      }
    },
    [onImageDrop],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (onContextMenu) {
        e.preventDefault();
        onContextMenu(e);
      }
    },
    [onContextMenu],
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="absolute inset-0 canvas-dots"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={5}
        panOnScroll
        selectionOnDrag={isSelectMode}
        selectionMode={SelectionMode.Partial}
        panOnDrag={spaceHeld ? [0, 1, 2] : false}
        nodesDraggable={isSelectMode}
        elementsSelectable={isSelectMode}
        selectNodesOnDrag={isSelectMode}
        multiSelectionKeyCode="Shift"
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        className={isCommentMode ? "cursor-crosshair" : "cursor-default"}
      >
        <Background gap={20} size={1} color="#e5e7eb" />
        <Controls className="!bottom-4 !left-4" />

        {toolbar && <Panel position="bottom-center">{toolbar}</Panel>}
      </ReactFlow>

      {groups.length === 0 && canvasImages.length === 0 && emptyTitle && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-300 mb-2">{emptyTitle}</h1>
            {emptyDescription && <p className="text-gray-400/70 text-sm">{emptyDescription}</p>}
          </div>
        </div>
      )}

      <style>{`
        .react-flow__node-designFrame,
        .react-flow__node-canvasImage {
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        .react-flow__node-designFrame.selected,
        .react-flow__node-canvasImage.selected {
          box-shadow: none !important;
        }
        .react-flow__node-designFrame .react-flow__handle {
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export type { CanvasAreaProps };
