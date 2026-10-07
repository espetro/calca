import type { Command, ShapeRecord } from "@calca/canvas-base";
import type {
  CanvasImage,
  Comment,
  GenerationGroup,
  PipelineStatus,
  Point,
  ToolMode,
} from "@calca/shared";
import { Background, Panel, SelectionMode, type Node, type NodeChange } from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { FlowCanvas, useCanvasStore } from "../adapter";
import type { CanvasHandle } from "../hooks/use-canvas";
import { useResolvedCssVar } from "../hooks/use-resolved-color";
import { calcaViews, imageToRecord, iterationToRecord } from "../views";
import { CanvasImageNode } from "./nodes/CanvasImageNode";
import { DesignFrameNode } from "./nodes/DesignFrameNode";

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

const propsEqual = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
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
  const store = useCanvasStore();
  if (!store) {
    throw new Error("CanvasArea must render inside a CanvasStoreProvider");
  }

  const isSelectMode = toolMode === "select" && !spaceHeld;
  const isCommentMode = toolMode === "comment" && !spaceHeld;

  // RF's <Background> paints `color` as an SVG attribute — var() doesn't
  // resolve there, so resolve --canvas-dot and re-read on theme flips.
  const dotColor = useResolvedCssVar("--canvas-dot", "#e5e7eb");

  // Bridge the app's controlled props into the document: diff by record id
  // and apply create/update/delete commands with history off (the app owns
  // persistence; the store is the render source of truth).
  const prevRecords = useRef(new Map<string, ShapeRecord>());
  useEffect(() => {
    const next = new Map<string, ShapeRecord>();
    const prev = prevRecords.current;
    const indexOf = (id: string) => prev.get(id)?.index ?? store.nextIndex(null);

    for (const group of groups) {
      for (const iteration of group.iterations) {
        next.set(iteration.id, iterationToRecord(iteration, group.id, indexOf(iteration.id)));
      }
    }
    for (const image of canvasImages) {
      next.set(image.id, imageToRecord(image, indexOf(image.id)));
    }

    const commands: Command[] = [];
    for (const [id, record] of next) {
      const existing = prev.get(id);
      if (!existing) {
        commands.push({ op: "create-shape", record });
      } else if (!propsEqual(existing.props, record.props)) {
        commands.push({ op: "update", id, props: record.props });
      }
    }
    for (const id of prev.keys()) {
      if (!next.has(id)) commands.push({ op: "delete", id });
    }

    prevRecords.current = next;
    if (commands.length > 0) {
      store.apply(commands, { origin: "remote", history: false });
    }
  }, [groups, canvasImages, store]);

  // Write document changes back into the app's jotai-backed props so
  // persistence and other consumers keep working unchanged.
  const onCommandsApplied = useCallback(
    (commands: Command[], _changes: NodeChange[]) => {
      const positionUpdates = new Map<string, Point>();
      const removedIds = new Set<string>();
      for (const command of commands) {
        if (command.op === "update" && typeof command.props.position === "object") {
          positionUpdates.set(command.id, command.props.position as Point);
        } else if (command.op === "delete") {
          removedIds.add(command.id);
        }
      }

      if (positionUpdates.size > 0) {
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
      }

      if (removedIds.size > 0) {
        onGroupsChange((prevGroups) =>
          prevGroups
            .map((group) => ({
              ...group,
              iterations: group.iterations.filter((iter) => !removedIds.has(iter.id)),
            }))
            .filter((group) => group.iterations.length > 0),
        );
        onCanvasImagesChange((prevImages) => prevImages.filter((img) => !removedIds.has(img.id)));
      }
    },
    [onGroupsChange, onCanvasImagesChange],
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
      onSelectedIdsChange(new Set(selectedNodes.map((n) => n.id)));
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

  const ctx = useMemo(
    () => ({
      isSelectMode,
      isCommentMode,
      selectedIds,
      pipelineStages,
      onAddComment,
      onClickComment,
    }),
    [isSelectMode, isCommentMode, selectedIds, pipelineStages, onAddComment, onClickComment],
  );

  return (
    <div
      className="absolute inset-0 bg-canvas-bg"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
    >
      <FlowCanvas
        views={calcaViews}
        data={ctx}
        nodeTypes={nodeTypes}
        onCommandsApplied={onCommandsApplied}
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
        <Background gap={24} size={1} color={dotColor} />

        {/* 1001: selected nodes elevate to z-index 1000 and must not cover the toolbar */}
        {toolbar && (
          <Panel position="top-center" style={{ zIndex: 1001 }}>
            {toolbar}
          </Panel>
        )}
      </FlowCanvas>

      {groups.length === 0 && canvasImages.length === 0 && emptyTitle && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-300 mb-2">{emptyTitle}</h1>
            {emptyDescription && <p className="text-gray-400/70 text-sm">{emptyDescription}</p>}
          </div>
        </div>
      )}

      <style>{`
        /* Canvas pans via wheel/trackpad — never let overscroll chain into
           the browser's history back/forward swipe. */
        .react-flow {
          overscroll-behavior: none;
        }
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
