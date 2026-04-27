import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  toolModeAtom,
  spaceHeldAtom,
  selectedIdsAtom,
} from "@/features/design/state/generation-atoms";
import { commentDraftAtom } from "@/features/design/state/comment-atoms";
import { groupsAtom } from "@/features/design/state/groups-atoms";
import { canvasImagesAtom } from "@/features/design/state/images-atoms";

/**
 * Registers global keyboard shortcuts (V, C, Space, Escape, Delete/Backspace).
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

  // Ref keeps the latest selectedIds without triggering effect re-runs
  const selectedIdsRef = useRef<Set<string>>(new Set());
  const selectedIds = useAtomValue(selectedIdsAtom);
  selectedIdsRef.current = selectedIds;

  useEffect(
    function registerGlobalKeyListeners() {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.key === "v" || e.key === "V") setToolMode("select");
        if (e.key === "c" || e.key === "C") setToolMode("comment");
        if (e.key === " ") {
          e.preventDefault();
          setSpaceHeld(true);
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
      };

      const onKeyUp = (e: KeyboardEvent) => {
        if (e.key === " ") setSpaceHeld(false);
      };

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      };
    },
    [setToolMode, setSpaceHeld, setCommentDraft, setSelectedIds, setGroups, setCanvasImages],
  );
};
