import { getLogger } from "@app/logger";
import { useAtom } from "jotai";
import { useCallback, useRef } from "react";

const logger = getLogger(["calca", "web", "comments"]);

import { trackCommentAdded } from "@app/analytics";

import {
  commentDraftAtom,
  activeCommentAtom,
  activeCommentIterationIdAtom,
  commentCountAtom,
} from "@/features/design/state/comment-atoms";
import { groupsAtom } from "@/features/design/state/groups-atoms";
import type { Comment as CommentType, CommentMessage } from "@/shared/types";

interface RevisionJob {
  iterationId: string;
  commentId: string;
  text: string;
  thread: CommentMessage[];
}

type RunPipelineForFrameFn = (
  iterId: string,
  prompt: string,
  style: string,
  index: number,
  critique: string | undefined,
  signal: AbortSignal,
  revisionOpts?: { revision: string; existingHtml: string },
) => Promise<{
  html: string;
  label: string;
  width?: number;
  height?: number;
  critique?: string;
  comment?: string;
}>;

export const useCommentHandlers = (runPipelineForFrame: RunPipelineForFrameFn) => {
  const [groups, setGroups] = useAtom(groupsAtom);
  const [commentDraft, setCommentDraft] = useAtom(commentDraftAtom);
  const [activeComment, setActiveComment] = useAtom(activeCommentAtom);
  const [activeCommentIterationId, setActiveCommentIterationId] = useAtom(
    activeCommentIterationIdAtom,
  );
  const [commentCount, setCommentCount] = useAtom(commentCountAtom);

  const revisionQueueRef = useRef<RevisionJob[]>([]);
  const isProcessingRevisionRef = useRef(false);

  const updateComment = useCallback(
    (iterId: string, cId: string, update: Partial<CommentType>) => {
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          iterations: g.iterations.map((iter) => {
            if (iter.id !== iterId) {
              return iter;
            }
            return {
              ...iter,
              comments: iter.comments.map((c) => (c.id === cId ? { ...c, ...update } : c)),
            };
          }),
        })),
      );
    },
    [setGroups],
  );

  const processRevisionQueue = useCallback(async () => {
    if (isProcessingRevisionRef.current) {
      return;
    }
    isProcessingRevisionRef.current = true;

    while (revisionQueueRef.current.length > 0) {
      const job = revisionQueueRef.current[0];
      const { iterationId, commentId, text } = job;

      updateComment(iterationId, commentId, { status: "working" });
      setActiveComment((prev) => (prev?.id === commentId ? { ...prev, status: "working" } : prev));

      let currentHtml = "";
      let currentPrompt = "";
      let latestThread: CommentMessage[] = [];
      for (const g of groups) {
        for (const iter of g.iterations) {
          if (iter.id === iterationId) {
            currentHtml = iter.html;
            currentPrompt = iter.prompt || "";
            const comment = iter.comments.find((c) => c.id === commentId);
            if (comment?.thread) {
              latestThread = comment.thread;
            }
          }
        }
      }

      try {
        const controller = new AbortController();
        const result = await runPipelineForFrame(
          iterationId,
          currentPrompt,
          "revision",
          0,
          undefined,
          controller.signal,
          { existingHtml: currentHtml, revision: text },
        );

        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            iterations: g.iterations.map((iter) => {
              if (iter.id !== iterationId) {
                return iter;
              }
              return {
                ...iter,
                height: result.height || iter.height,
                html: result.html || iter.html,
                width: result.width || iter.width,
              };
            }),
          })),
        );

        const calcaResponse: CommentMessage = {
          createdAt: Date.now(),
          id: `msg-${Date.now()}`,
          role: "calca",
          text: result.comment || "Done! I've updated the design.",
        };
        const doneThread = [...latestThread, calcaResponse];
        updateComment(iterationId, commentId, {
          aiResponse: calcaResponse.text,
          status: "done",
          thread: doneThread,
        });
        setActiveComment((prev) =>
          prev?.id === commentId
            ? {
                ...prev,
                aiResponse: calcaResponse.text,
                status: "done",
                thread: doneThread,
              }
            : prev,
        );
      } catch (error) {
        logger.error("Revision failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        const errorResponse: CommentMessage = {
          id: `msg-${Date.now()}`,
          role: "calca",
          text: `Revision failed: ${error instanceof Error ? error.message : "Unknown error"}. Try again.`,
          createdAt: Date.now(),
        };
        const errorThread = [...latestThread, errorResponse];
        updateComment(iterationId, commentId, {
          aiResponse: errorResponse.text,
          status: "done",
          thread: errorThread,
        });
        setActiveComment((prev) =>
          prev?.id === commentId
            ? {
                ...prev,
                aiResponse: errorResponse.text,
                status: "done",
                thread: errorThread,
              }
            : prev,
        );
      }

      revisionQueueRef.current.shift();
    }

    isProcessingRevisionRef.current = false;
  }, [runPipelineForFrame, updateComment, groups, setGroups, setActiveComment]);

  const handleCommentSubmit = useCallback(
    (text: string) => {
      if (!commentDraft) {
        return;
      }
      const nextCount = commentCount + 1;
      setCommentCount(nextCount);
      trackCommentAdded(false, nextCount);

      const commentId = `comment-${Date.now()}`;
      const userMessage: CommentMessage = {
        createdAt: Date.now(),
        id: `msg-${Date.now()}`,
        role: "user",
        text,
      };
      const newComment: CommentType = {
        createdAt: Date.now(),
        id: commentId,
        number: nextCount,
        position: commentDraft.position,
        status: "waiting",
        text,
        thread: [userMessage],
      };

      const iterId = commentDraft.iterationId;

      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          iterations: g.iterations.map((iter) => {
            if (iter.id === iterId) {
              return {
                ...iter,
                comments: [...iter.comments, newComment],
              };
            }
            return iter;
          }),
        })),
      );

      setCommentDraft(null);

      revisionQueueRef.current.push({
        commentId,
        iterationId: iterId,
        text,
        thread: [userMessage],
      });

      processRevisionQueue();
    },
    [commentDraft, commentCount, processRevisionQueue, setCommentCount, setCommentDraft, setGroups],
  );

  const handleCommentReply = useCallback(
    (text: string) => {
      if (!activeComment || !activeCommentIterationId) {
        return;
      }

      const commentId = activeComment.id;
      const iterId = activeCommentIterationId;
      const currentThread = activeComment.thread || [
        {
          createdAt: activeComment.createdAt,
          id: "msg-0",
          role: "user" as const,
          text: activeComment.text,
        },
      ];

      const userMessage: CommentMessage = {
        createdAt: Date.now(),
        id: `msg-${Date.now()}`,
        role: "user",
        text,
      };
      const updatedThread = [...currentThread, userMessage];

      updateComment(iterId, commentId, {
        status: "waiting",
        thread: updatedThread,
      });
      setActiveComment((prev) =>
        prev ? { ...prev, status: "waiting", thread: updatedThread } : prev,
      );

      revisionQueueRef.current.push({
        commentId,
        iterationId: iterId,
        text,
        thread: updatedThread,
      });

      trackCommentAdded(true, commentCount + 1);
      processRevisionQueue();
    },
    [activeComment, activeCommentIterationId, commentCount, processRevisionQueue, setActiveComment],
  );

  return {
    activeComment,
    activeCommentIterationId,
    commentDraft,
    handleCommentReply,
    handleCommentSubmit,
    setActiveComment,
    setActiveCommentIterationId,
    setCommentDraft,
  };
};
