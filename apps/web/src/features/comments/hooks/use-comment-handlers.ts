import { useCallback, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { getLogger } from "@app/logger";
import { groupsAtom } from "@/features/design/state/groups-atoms";
import {
  commentDraftAtom,
  activeCommentAtom,
  activeCommentIterationIdAtom,
  commentCountAtom,
} from "@/features/design/state/comment-atoms";
import type {
  Comment as CommentType,
  CommentMessage,
} from "@/shared/types";

interface RevisionJob {
  iterationId: string;
  commentId: string;
  text: string;
  thread: CommentMessage[];
}

interface RunPipelineForFrameFn {
  (
    iterId: string,
    prompt: string,
    style: string,
    index: number,
    critique: string | undefined,
    signal: AbortSignal,
    revisionOpts?: { revision: string; existingHtml: string }
  ): Promise<{
    html: string;
    label: string;
    width?: number;
    height?: number;
    critique?: string;
    comment?: string;
  }>;
}

export const useCommentHandlers = (
  runPipelineForFrame: RunPipelineForFrameFn
) => {
  const [groups, setGroups] = useAtom(groupsAtom);
  const [commentDraft, setCommentDraft] = useAtom(commentDraftAtom);
  const [activeComment, setActiveComment] = useAtom(activeCommentAtom);
  const [activeCommentIterationId, setActiveCommentIterationId] = useAtom(
    activeCommentIterationIdAtom
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
            if (iter.id !== iterId) return iter;
            return {
              ...iter,
              comments: iter.comments.map((c) =>
                c.id === cId ? { ...c, ...update } : c
              ),
            };
          }),
        }))
      );
    },
    [setGroups]
  );

  const processRevisionQueue = useCallback(async () => {
    if (isProcessingRevisionRef.current) return;
    isProcessingRevisionRef.current = true;

    while (revisionQueueRef.current.length > 0) {
      const job = revisionQueueRef.current[0];
      const { iterationId, commentId, text } = job;

      updateComment(iterationId, commentId, { status: "working" });
      setActiveComment((prev) =>
        prev?.id === commentId ? { ...prev, status: "working" } : prev
      );

      let currentHtml = "";
      let currentPrompt = "";
      let latestThread: CommentMessage[] = [];
      for (const g of groups) {
        for (const iter of g.iterations) {
          if (iter.id === iterationId) {
            currentHtml = iter.html;
            currentPrompt = iter.prompt || "";
            const comment = iter.comments.find((c) => c.id === commentId);
            if (comment?.thread) latestThread = comment.thread;
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
          { revision: text, existingHtml: currentHtml }
        );

        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            iterations: g.iterations.map((iter) => {
              if (iter.id !== iterationId) return iter;
              return {
                ...iter,
                html: result.html || iter.html,
                width: result.width || iter.width,
                height: result.height || iter.height,
              };
            }),
          }))
        );

        const calcaResponse: CommentMessage = {
          id: `msg-${Date.now()}`,
          role: "calca",
          text: result.comment || "Done! I've updated the design.",
          createdAt: Date.now(),
        };
        const doneThread = [...latestThread, calcaResponse];
        updateComment(iterationId, commentId, {
          status: "done",
          aiResponse: calcaResponse.text,
          thread: doneThread,
        });
        setActiveComment((prev) =>
          prev?.id === commentId
            ? {
                ...prev,
                status: "done",
                aiResponse: calcaResponse.text,
                thread: doneThread,
              }
            : prev
        );
      } catch (err) {
        getLogger(["calca", "web", "comments"]).error("Revision failed", { error: err instanceof Error ? err.message : String(err) });
        const errorResponse: CommentMessage = {
          id: `msg-${Date.now()}`,
          role: "calca",
          text: `Revision failed: ${err instanceof Error ? err.message : "Unknown error"}. Try again.`,
          createdAt: Date.now(),
        };
        const errorThread = [...latestThread, errorResponse];
        updateComment(iterationId, commentId, {
          status: "done",
          aiResponse: errorResponse.text,
          thread: errorThread,
        });
        setActiveComment((prev) =>
          prev?.id === commentId
            ? {
                ...prev,
                status: "done",
                aiResponse: errorResponse.text,
                thread: errorThread,
              }
            : prev
        );
      }

      revisionQueueRef.current.shift();
    }

    isProcessingRevisionRef.current = false;
  }, [runPipelineForFrame, updateComment, groups, setGroups, setActiveComment]);

  const handleCommentSubmit = useCallback(
    (text: string) => {
      if (!commentDraft) return;
      const nextCount = commentCount + 1;
      setCommentCount(nextCount);

      const commentId = `comment-${Date.now()}`;
      const userMessage: CommentMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        text,
        createdAt: Date.now(),
      };
      const newComment: CommentType = {
        id: commentId,
        position: commentDraft.position,
        text,
        number: nextCount,
        createdAt: Date.now(),
        status: "waiting",
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
        }))
      );

      setCommentDraft(null);

      revisionQueueRef.current.push({
        iterationId: iterId,
        commentId,
        text,
        thread: [userMessage],
      });

      processRevisionQueue();
    },
    [
      commentDraft,
      commentCount,
      processRevisionQueue,
      setCommentCount,
      setCommentDraft,
      setGroups,
    ]
  );

  const handleCommentReply = useCallback(
    (text: string) => {
      if (!activeComment || !activeCommentIterationId) return;

      const commentId = activeComment.id;
      const iterId = activeCommentIterationId;
      const currentThread = activeComment.thread || [
        {
          id: "msg-0",
          role: "user" as const,
          text: activeComment.text,
          createdAt: activeComment.createdAt,
        },
      ];

      const userMessage: CommentMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        text,
        createdAt: Date.now(),
      };
      const updatedThread = [...currentThread, userMessage];

      updateComment(iterId, commentId, {
        thread: updatedThread,
        status: "waiting",
      });
      setActiveComment((prev) =>
        prev
          ? { ...prev, thread: updatedThread, status: "waiting" }
          : prev
      );

      revisionQueueRef.current.push({
        iterationId: iterId,
        commentId,
        text,
        thread: updatedThread,
      });

      processRevisionQueue();
    },
    [activeComment, activeCommentIterationId, updateComment, processRevisionQueue, setActiveComment]
  );

  return {
    handleCommentSubmit,
    handleCommentReply,
    commentDraft,
    setCommentDraft,
    activeComment,
    setActiveComment,
    activeCommentIterationId,
    setActiveCommentIterationId,
  };
};
