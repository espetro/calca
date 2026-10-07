import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "#/shared/components/ui/button";
import { Separator } from "#/shared/components/ui/separator";
import { Textarea } from "#/shared/components/ui/textarea";
import type { Comment, CommentMessage } from "#/shared/types";

interface CommentThreadProps {
  comment: Comment;
  onClose: () => void;
  onReply: (text: string) => void;
}

const CommentThread = ({ comment, onClose, onReply }: CommentThreadProps) => {
  const [replyText, setReplyText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Build thread from either the thread array or legacy text/aiResponse fields
  const thread: CommentMessage[] =
    comment.thread && comment.thread.length > 0
      ? comment.thread
      : [
          { createdAt: comment.createdAt, id: "msg-0", role: "user" as const, text: comment.text },
          ...(comment.aiResponse
            ? [
                {
                  createdAt: comment.createdAt + 1,
                  id: "msg-1",
                  role: "calca" as const,
                  text: comment.aiResponse,
                },
              ]
            : []),
        ];

  // oxlint-disable -- DOM scroll side-effect reacting to thread data change. Cannot use derived state for scroll position.
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [thread.length]);

  const handleSubmit = () => {
    const trimmed = replyText.trim();
    if (!trimmed) {
      return;
    }
    setReplyText("");
    onReply(trimmed);
  };

  const isWorking = comment.status === "working";

  return (
    <div className="fixed top-4 right-4 z-50 bg-glass-bg backdrop-blur-2xl rounded-2xl border border-glass-border shadow-glass w-[300px] flex flex-col max-h-[480px]">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 pb-2.5">
        <span className="w-6 h-6 rounded-full bg-primary/90 text-primary-foreground text-[11px] font-bold flex items-center justify-center shadow-sm">
          {comment.number}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Comment #{comment.number}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="ml-auto text-muted-foreground hover:text-foreground text-sm leading-none p-1 rounded-lg hover:bg-foreground/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Thread messages */}
      <div ref={threadRef} className="flex-1 overflow-y-auto px-4 pb-2 space-y-2.5 min-h-0">
        {thread.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "calca" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`rounded-xl px-3 py-2 max-w-[85%] ${
                msg.role === "calca"
                  ? "bg-muted/80 text-foreground"
                  : "bg-primary/90 text-primary-foreground"
              }`}
            >
              {msg.role === "calca" && (
                <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">Calca</div>
              )}
              <p className="text-[13px] leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Working indicator */}
        {isWorking && (
          <div className="flex justify-start">
            <div className="bg-muted/80 rounded-xl px-3 py-2">
              <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">Calca</div>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">Revising...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reply input */}
      <Separator />
      <div className="p-3 pt-1.5">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Reply with another revision..."
            disabled={isWorking}
            className="flex-1 text-[13px] text-foreground placeholder:text-muted-foreground/60 bg-card/60 backdrop-blur-sm rounded-xl px-3 py-2 outline-none resize-none border border-border/40 focus:border-ring/60 focus:bg-card/80 transition-all disabled:opacity-50"
            rows={1}
          />
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={!replyText.trim() || isWorking}
            className="text-[12px] font-medium text-primary-foreground bg-primary/90 hover:bg-primary disabled:opacity-30 px-3 py-2 rounded-xl transition-all shadow-sm shrink-0"
          >
            ↵
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentThread;
