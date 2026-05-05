import { useAtomValue, useSetAtom } from "jotai";
import { useRef } from "react";

import { canvasOffsetAtom, canvasScaleAtom } from "#/features/canvas/state/canvas-atoms";
import { copyFrames, cutFrames, pasteFrames } from "#/features/canvas/lib/frame-clipboard";
import { clipboardAtom } from "#/features/design/state/clipboard-atoms";
import { commentDraftAtom } from "#/features/design/state/comment-atoms";
import {
  selectedIdsAtom,
  spaceHeldAtom,
  toolModeAtom,
} from "#/features/design/state/generation-atoms";
import { groupsAtom } from "#/features/design/state/groups-atoms";
import { canvasImagesAtom } from "#/features/design/state/images-atoms";
import { feedbackModalOpenAtom } from "#/features/feedback/store";
import { useMountEffect } from "#/shared/utils/use-mount-effect";

/**
 * Registers global keyboard shortcuts (V, C, Space, Escape, Delete/Backspace, Cmd+Shift+B).
 *
 * Uses a ref for `selectedIds` so the window listeners are registered only once
 * on mount, eliminating the listener-churn bug from the original page.tsx where
 * every `selectedIds` change tore down and re-attached keydown/keyup listeners.
 */
export const useKeyboardShortcuts = () => {
  const setToolMode = useSetAtom(toolModeAtom);
  const setSpaceHeld = useSetAtom(spaceHeldAtom);
  const setSelectedIds = useSetAtom(selectedIdsAtom);
  const setCommentDraft = useSetAtom(commentDraftAtom);
  const setGroups = useSetAtom(groupsAtom);
  const setCanvasImages = useSetAtom(canvasImagesAtom);
  const setFeedbackOpen = useSetAtom(feedbackModalOpenAtom);
  const setClipboard = useSetAtom(clipboardAtom);

  const groups = useAtomValue(groupsAtom);
  const images = useAtomValue(canvasImagesAtom);
  const canvasOffset = useAtomValue(canvasOffsetAtom);
  const canvasScale = useAtomValue(canvasScaleAtom);
  const clipboard = useAtomValue(clipboardAtom);

  // Ref keeps the latest selectedIds without triggering effect re-runs
  const selectedIdsRef = useRef<Set<string>>(new Set());
  const selectedIds = useAtomValue(selectedIdsAtom);
  selectedIdsRef.current = selectedIds;

  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useMountEffect(function registerGlobalKeyListeners() {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "v" || e.key === "V") {
        setToolMode("select");
      }
      if (e.key === "c" || e.key === "C") {
        setToolMode("comment");
      }
      if (e.key === " ") {
        e.preventDefault();
        setSpaceHeld(true);
      }
      if (e.key === "b" || e.key === "B") {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          if (e.shiftKey) {
            setFeedbackOpen(true);
          }
        }
      }
      if (e.key === "Escape") {
        setCommentDraft(null);
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            iterations: g.iterations.map((iter) => ({
              ...iter,
              isRegenerating: false,
            })),
          })),
        );
        setSelectedIds(new Set());
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIdsRef.current.size > 0) {
        setGroups((prev) =>
          prev
            .map((g) => ({
              ...g,
              iterations: g.iterations.filter((iter) => !selectedIdsRef.current.has(iter.id)),
            }))
            .filter((g) => g.iterations.length > 0),
        );
        setCanvasImages((prev) => prev.filter((img) => !selectedIdsRef.current.has(img.id)));
        setSelectedIds(new Set());
      }

      // Cmd/Ctrl + A — select all frames
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        const allIds = new Set<string>();
        for (const g of groups) {
          for (const iter of g.iterations) {
            allIds.add(iter.id);
          }
        }
        setSelectedIds(allIds);
      }

      // Cmd/Ctrl + C — copy selected frames
      if ((e.metaKey || e.ctrlKey) && e.key === "c" && selectedIdsRef.current.size > 0) {
        e.preventDefault();
        const data = copyFrames(selectedIdsRef.current, groups, images);
        if (data) {
          setClipboard(data);
        }
      }

      // Cmd/Ctrl + V — paste from clipboard at viewport center
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && clipboard) {
        e.preventDefault();
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        const viewportCenter = {
          x: (screenCenterX - canvasOffset.x) / canvasScale,
          y: (screenCenterY - canvasOffset.y) / canvasScale,
        };
        const { groups: newGroups, images: newImages } = pasteFrames(clipboard, viewportCenter);
        setGroups((prev) => [...prev, ...newGroups]);
        setCanvasImages((prev) => [...prev, ...newImages]);
      }

      // Cmd/Ctrl + X — cut selected frames
      if ((e.metaKey || e.ctrlKey) && e.key === "x" && selectedIdsRef.current.size > 0) {
        e.preventDefault();
        const { clipboardData, groups: updatedGroups, images: updatedImages } = cutFrames(
          selectedIdsRef.current,
          groups,
          images,
        );
        if (clipboardData) {
          setClipboard(clipboardData);
          setGroups(updatedGroups);
          setCanvasImages(updatedImages);
          setSelectedIds(new Set());
        }
      }

      // Cmd/Ctrl + D — duplicate selected frames (offset by 20px from original position)
      if ((e.metaKey || e.ctrlKey) && e.key === "d" && selectedIdsRef.current.size > 0) {
        e.preventDefault();
        const clipboardData = copyFrames(selectedIdsRef.current, groups, images);
        if (clipboardData) {
          const screenCenterX = window.innerWidth / 2;
          const screenCenterY = window.innerHeight / 2;
          // Offset from viewport center by (20, 20)
          const viewportCenter = {
            x: (screenCenterX - canvasOffset.x) / canvasScale + 20,
            y: (screenCenterY - canvasOffset.y) / canvasScale + 20,
          };
          const { groups: newGroups, images: newImages } = pasteFrames(clipboardData, viewportCenter);
          setGroups((prev) => [...prev, ...newGroups]);
          setCanvasImages((prev) => [...prev, ...newImages]);
          // Select the newly duplicated frames
          const newIds = new Set<string>();
          for (const g of newGroups) {
            for (const iter of g.iterations) {
              newIds.add(iter.id);
            }
          }
          setSelectedIds(newIds);
        }
      }

      // Cmd/Ctrl + Z — undo (wired via native Edit menu roles; no local undo system exists)
      // Cmd/Ctrl + Shift + Z — redo (wired via native Edit menu roles)
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setSpaceHeld(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });
};
