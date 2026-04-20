import { useCallback, useRef, type RefCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { DesignCard, DEFAULT_FRAME_WIDTH as FRAME_WIDTH } from "@/features/design";
import { PipelineStatusOverlay } from "@/features/canvas";
import { type useCanvas } from "@/features/canvas/hooks/use-canvas";
import { groupsAtom } from "@/features/design/state/groups-atoms";
import { canvasImagesAtom } from "@/features/design/state/images-atoms";
import {
  toolModeAtom,
  spaceHeldAtom,
  rubberBandAtom,
  selectedIdsAtom,
  draggingImageIdAtom,
  pipelineStagesAtom,
} from "@/features/design/state/generation-atoms";
import {
  draggingIdAtom,
  activeCommentAtom,
  activeCommentIterationIdAtom,
  commentDraftAtom,
} from "@/features/design/state/comment-atoms";
import { settingsAtom } from "@/features/settings/state/settings-atoms";
import { deriveProviderFields } from "@/features/settings/lib/derive-provider-fields";
import type {
  DesignIteration,
  Point,
} from "@/shared/types";
import { RubberBandOverlay } from "@/widgets/rubber-band-selection";
import { useMemo } from "react";

type CanvasHandle = ReturnType<typeof useCanvas>;

interface CanvasAreaProps {
  canvas: CanvasHandle;
  onRemix: (sourceIteration: DesignIteration, remixPrompt: string) => void;
}

export const CanvasArea = ({ canvas, onRemix }: CanvasAreaProps) => {
  const [groups, setGroups] = useAtom(groupsAtom);
  const [canvasImages, setCanvasImages] = useAtom(canvasImagesAtom);
  const toolMode = useAtomValue(toolModeAtom);
  const spaceHeld = useAtomValue(spaceHeldAtom);
  const selectedIds = useAtomValue(selectedIdsAtom);
  const setSelectedIds = useSetAtom(selectedIdsAtom);
  const [rubberBand, setRubberBand] = useAtom(rubberBandAtom);
  const [draggingId, setDraggingId] = useAtom(draggingIdAtom);
  const [draggingImageId, setDraggingImageId] = useAtom(draggingImageIdAtom);
  const pipelineStages = useAtomValue(pipelineStagesAtom);
  const settings = useAtomValue(settingsAtom);
  const derived = useMemo(
    () => deriveProviderFields(settings.providers, settings.model),
    [settings.providers, settings.model]
  );
  const setActiveComment = useSetAtom(activeCommentAtom);
  const setActiveCommentIterationId = useSetAtom(activeCommentIterationIdAtom);
  const setCommentDraft = useSetAtom(commentDraftAtom);

  const canvasElRef = useRef<HTMLDivElement | null>(null);
  const combinedCanvasRef: RefCallback<HTMLDivElement> = useCallback(
    (el) => {
      canvasElRef.current = el;
      canvas.setCanvasRef(el);
    },
    [canvas.setCanvasRef]
  );

  const dragRef = useRef<{
    iterationId: string;
    startMouse: Point;
    startPos: Point;
  } | null>(null);
  const dragStartPositions = useRef<Map<string, Point>>(new Map());

  const imgDragRef = useRef<{
    id: string;
    startMouse: Point;
    startPos: Point;
  } | null>(null);
  const imgDragStartPositions = useRef<Map<string, Point>>(new Map());

  const allIterations = groups.flatMap((g) =>
    g.iterations.map((iter) => ({ ...iter, groupId: g.id }))
  );

  const canPan = spaceHeld && !draggingId;
  const isSelectMode = toolMode === "select" && !spaceHeld;

  const handleImageDragStart = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (toolMode !== "select" || spaceHeld) return;
      e.stopPropagation();
      const img = canvasImages.find((i) => i.id === id);
      if (!img) return;
      imgDragRef.current = {
        id,
        startMouse: { x: e.clientX, y: e.clientY },
        startPos: { ...img.position },
      };
      imgDragStartPositions.current.clear();
      const movingIds = selectedIds.has(id) ? selectedIds : new Set([id]);
      for (const ci of canvasImages) {
        if (movingIds.has(ci.id))
          imgDragStartPositions.current.set(ci.id, { ...ci.position });
      }
      setDraggingImageId(id);
    },
    [toolMode, spaceHeld, canvasImages, selectedIds, setDraggingImageId]
  );

  const handleImageDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!imgDragRef.current) return;
      const dx =
        (e.clientX - imgDragRef.current.startMouse.x) / canvas.scale;
      const dy =
        (e.clientY - imgDragRef.current.startMouse.y) / canvas.scale;
      const dragId = imgDragRef.current.id;
      const movingIds = selectedIds.has(dragId) ? selectedIds : new Set([dragId]);
      setCanvasImages((prev) =>
        prev.map((img) => {
          if (!movingIds.has(img.id)) return img;
          const startPos =
            imgDragStartPositions.current.get(img.id) || img.position;
          return { ...img, position: { x: startPos.x + dx, y: startPos.y + dy } };
        })
      );
    },
    [canvas.scale, selectedIds, setCanvasImages]
  );

  const handleImageDragEnd = useCallback(() => {
    imgDragRef.current = null;
    setDraggingImageId(null);
  }, [setDraggingImageId]);

  const handleFrameDragStart = useCallback(
    (iterationId: string, e: React.MouseEvent) => {
      if (toolMode !== "select" || spaceHeld) return;
      e.stopPropagation();
      for (const group of groups) {
        const iter = group.iterations.find((it) => it.id === iterationId);
        if (iter) {
          dragRef.current = {
            iterationId,
            startMouse: { x: e.clientX, y: e.clientY },
            startPos: { ...iter.position },
          };
          dragStartPositions.current.clear();
          const movingIds = selectedIds.has(iterationId)
            ? selectedIds
            : new Set([iterationId]);
          for (const g of groups) {
            for (const it of g.iterations) {
              if (movingIds.has(it.id)) {
                dragStartPositions.current.set(it.id, { ...it.position });
              }
            }
          }
          setDraggingId(iterationId);
          break;
        }
      }
    },
    [toolMode, spaceHeld, groups, selectedIds, setDraggingId]
  );

  const handleFrameDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current) return;
      const dx =
        (e.clientX - dragRef.current.startMouse.x) / canvas.scale;
      const dy =
        (e.clientY - dragRef.current.startMouse.y) / canvas.scale;
      const dragId = dragRef.current.iterationId;
      const movingIds = selectedIds.has(dragId) ? selectedIds : new Set([dragId]);
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          iterations: g.iterations.map((iter) => {
            if (!movingIds.has(iter.id)) return iter;
            const startPos =
              dragStartPositions.current.get(iter.id) || iter.position;
            return {
              ...iter,
              position: { x: startPos.x + dx, y: startPos.y + dy },
            };
          }),
        }))
      );
    },
    [canvas.scale, selectedIds, setGroups]
  );

  const handleFrameDragEnd = useCallback(() => {
    dragRef.current = null;
    setDraggingId(null);
  }, [setDraggingId]);

  const processImageFiles = useCallback(
    (files: File[], dropX?: number, dropY?: number) => {
      files.forEach((file, idx) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const maxDim = 1024;
            const apiScale = Math.min(
              maxDim / Math.max(img.width, img.height),
              1
            );
            const apiCanvas = document.createElement("canvas");
            apiCanvas.width = img.width * apiScale;
            apiCanvas.height = img.height * apiScale;
            const apiCtx = apiCanvas.getContext("2d")!;
            apiCtx.drawImage(img, 0, 0, apiCanvas.width, apiCanvas.height);
            const compressedDataUrl = apiCanvas.toDataURL("image/jpeg", 0.7);

            const thumbScale = Math.min(
              128 / img.width,
              128 / img.height,
              1
            );
            const thumbCanvas = document.createElement("canvas");
            thumbCanvas.width = img.width * thumbScale;
            thumbCanvas.height = img.height * thumbScale;
            const thumbCtx = thumbCanvas.getContext("2d")!;
            thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
            const thumbnail = thumbCanvas.toDataURL("image/jpeg", 0.7);

            const cx =
              dropX !== undefined
                ? (dropX - canvas.offset.x) / canvas.scale
                : 100 + idx * 220;
            const cy =
              dropY !== undefined
                ? (dropY - canvas.offset.y) / canvas.scale
                : 100;

            const displayScale = Math.min(200 / img.width, 1);

            setCanvasImages((prev) => [
              ...prev,
              {
                id: `img-${Date.now()}-${idx}`,
                dataUrl: compressedDataUrl,
                name: file.name,
                width: img.width * displayScale,
                height: img.height * displayScale,
                position: { x: cx, y: cy },
                thumbnail,
              },
            ]);
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
    },
    [canvas.offset.x, canvas.offset.y, canvas.scale, setCanvasImages]
  );

  const handleClickComment = useCallback(
    (comment: import("@/shared/types").Comment, iterationId: string) => {
      setActiveComment((prev) =>
        prev?.id === comment.id ? null : comment
      );
      setActiveCommentIterationId((prev) =>
        comment ? iterationId : null
      );
    },
    [setActiveComment, setActiveCommentIterationId]
  );

  const handleAddComment = useCallback(
    (iterationId: string, position: Point) => {
      const rect = canvasElRef.current?.getBoundingClientRect();
      if (!rect) return;
      for (const group of groups) {
        const iter = group.iterations.find((it) => it.id === iterationId);
        if (iter) {
          const absScreenX =
            (iter.position.x + position.x) * canvas.scale +
            canvas.offset.x +
            rect.left;
          const absScreenY =
            (iter.position.y + position.y) * canvas.scale +
            canvas.offset.y +
            rect.top;
          setCommentDraft({
            iterationId,
            position,
            screenX: absScreenX,
            screenY: absScreenY,
          });
          return;
        }
      }
    },
    [canvas.offset, canvas.scale, groups, setCommentDraft]
  );

  return (
    <div
      ref={combinedCanvasRef}
      className={`absolute inset-0 canvas-dots ${
        canPan ? "cursor-grab active:cursor-grabbing" : ""
      } ${
        toolMode === "comment" && !spaceHeld
          ? "cursor-crosshair"
          : "cursor-default"
      }`}
      onMouseDown={(e) => {
        if (canPan) {
          canvas.onMouseDown(e);
          return;
        }
        if (isSelectMode && !draggingId) {
          if (!e.shiftKey) setSelectedIds(new Set());
          setRubberBand({
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
          });
        }
      }}
      onMouseMove={(e) => {
        if (draggingImageId) {
          handleImageDragMove(e);
        } else if (draggingId) {
          handleFrameDragMove(e);
        } else if (rubberBand) {
          setRubberBand((prev) =>
            prev
              ? { ...prev, currentX: e.clientX, currentY: e.clientY }
              : null
          );
        } else {
          canvas.onMouseMove(e);
        }
      }}
      onMouseUp={() => {
        if (draggingImageId) {
          handleImageDragEnd();
        } else if (draggingId) {
          handleFrameDragEnd();
        } else if (rubberBand) {
          const rb = rubberBand;
          const minScreenX = Math.min(rb.startX, rb.currentX);
          const maxScreenX = Math.max(rb.startX, rb.currentX);
          const minScreenY = Math.min(rb.startY, rb.currentY);
          const maxScreenY = Math.max(rb.startY, rb.currentY);

          if (maxScreenX - minScreenX > 5 || maxScreenY - minScreenY > 5) {
            const toCanvasX = (sx: number) =>
              (sx - canvas.offset.x) / canvas.scale;
            const toCanvasY = (sy: number) =>
              (sy - canvas.offset.y) / canvas.scale;
            const canvasMinX = toCanvasX(minScreenX);
            const canvasMaxX = toCanvasX(maxScreenX);
            const canvasMinY = toCanvasY(minScreenY);
            const canvasMaxY = toCanvasY(maxScreenY);

            const newSelected = new Set(selectedIds);
            for (const iter of allIterations) {
              const ix = iter.position.x;
              const iy = iter.position.y;
              const iw = iter.width || FRAME_WIDTH;
              const ih = iter.height || 300;
              if (
                ix + iw > canvasMinX &&
                ix < canvasMaxX &&
                iy + ih > canvasMinY &&
                iy < canvasMaxY
              ) {
                newSelected.add(iter.id);
              }
            }
            for (const img of canvasImages) {
              const ix = img.position.x;
              const iy = img.position.y;
              if (
                ix + img.width > canvasMinX &&
                ix < canvasMaxX &&
                iy + img.height > canvasMinY &&
                iy < canvasMaxY
              ) {
                newSelected.add(img.id);
              }
            }
            setSelectedIds(newSelected);
          }
          setRubberBand(null);
        } else {
          canvas.onMouseUp();
        }
      }}
      onMouseLeave={() => {
        if (draggingImageId) {
          handleImageDragEnd();
        } else if (draggingId) {
          handleFrameDragEnd();
        } else {
          setRubberBand(null);
          canvas.onMouseUp();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length > 0) processImageFiles(files, e.clientX, e.clientY);
      }}
    >
      <div
        style={{
          transform: `translate(${canvas.offset.x}px, ${canvas.offset.y}px) scale(${canvas.scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        {canvasImages.map((img) => (
          <div
            key={img.id}
            className={`absolute group rounded-lg overflow-hidden shadow-md transition-shadow ${
              selectedIds.has(img.id)
                ? "ring-2 ring-blue-500 border-blue-400/50 shadow-lg"
                : "border border-white/40 hover:shadow-lg"
            } ${
              toolMode === "select" && !spaceHeld
                ? draggingImageId === img.id
                  ? "cursor-grabbing shadow-xl ring-2 ring-blue-400/30"
                  : "cursor-grab"
                : ""
            }`}
            style={{
              left: img.position.x,
              top: img.position.y,
              width: img.width,
              height: img.height,
            }}
            onMouseDown={(e) => handleImageDragStart(img.id, e)}
            onClick={(e) => {
              if (toolMode !== "select" || spaceHeld) return;
              e.stopPropagation();
              if (e.shiftKey) {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(img.id)) next.delete(img.id);
                  else next.add(img.id);
                  return next;
                });
              } else {
                setSelectedIds(new Set([img.id]));
              }
            }}
          >
            <img
              src={img.dataUrl}
              alt={img.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white bg-black/50 rounded px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {img.name}
            </span>
          </div>
        ))}

        {allIterations.map((iteration) => (
          <DesignCard
            key={iteration.id}
            iteration={iteration}
            isCommentMode={toolMode === "comment" && !spaceHeld}
            isSelectMode={toolMode === "select" && !spaceHeld}
            isDragging={draggingId === iteration.id}
            isSelected={selectedIds.has(iteration.id)}
            onSelect={(e?: React.MouseEvent) => {
              if (e?.shiftKey) {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(iteration.id)) next.delete(iteration.id);
                  else next.add(iteration.id);
                  return next;
                });
              } else {
                setSelectedIds(new Set([iteration.id]));
              }
            }}
            onAddComment={handleAddComment}
            onClickComment={handleClickComment}
            onDragStart={(e) => handleFrameDragStart(iteration.id, e)}
            onRemix={onRemix}
            scale={canvas.scale}
            apiKey={derived.apiKey || undefined}
            model={derived.model}
            providerType={derived.providerType || undefined}
            baseURL={derived.baseURL || undefined}
            pipelineStatus={pipelineStages[iteration.id]}
          />
        ))}

        {allIterations.map((iteration) => {
          const status = pipelineStages[iteration.id];
          if (!status || status.stage === "done") return null;
          return (
            <PipelineStatusOverlay
              key={`pipeline-${iteration.id}`}
              status={status}
              x={iteration.position.x}
              y={iteration.position.y}
              width={iteration.width || FRAME_WIDTH}
              frameHeight={
                iteration.isLoading ? 320 : iteration.height || 320
              }
            />
          );
        })}
      </div>

      {groups.length === 0 && canvasImages.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-300 mb-2">
              Otto Canvas
            </h1>
            <p className="text-gray-400/70 text-sm">
              Type a prompt below to generate designs
            </p>
          </div>
        </div>
      )}

      <RubberBandOverlay />
    </div>
  );
};

export type { CanvasAreaProps };
