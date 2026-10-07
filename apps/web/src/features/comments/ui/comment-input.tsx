import { useRef, useState } from "react";

import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";
import { Textarea } from "#/shared/components/ui/textarea";
import { useMountEffect } from "#/shared/utils/use-mount-effect";

interface CommentInputProps {
  position: { screenX: number; screenY: number };
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

const CommentInput = ({ position, onSubmit, onCancel }: CommentInputProps) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useMountEffect(() => {
    inputRef.current?.focus();
  });

  // Clamp position so it doesn't overflow viewport
  const clampedX = Math.min(position.screenX + 16, window.innerWidth - 300);
  const clampedY = Math.min(position.screenY - 8, window.innerHeight - 200);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-[60]"
      style={{
        left: clampedX,
        top: Math.max(8, clampedY),
      }}
    >
      <div className="bg-glass-bg backdrop-blur-2xl rounded-2xl border border-glass-border shadow-glass p-3 w-[272px]">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
          {m.comments_revisionComment()}
        </div>
        <Textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === "Escape") {
              onCancel();
            }
          }}
          placeholder={m.comments_describeRevision()}
          className="w-full text-[13px] text-foreground placeholder:text-muted-foreground/60 bg-card/60 backdrop-blur-sm rounded-xl px-3 py-2.5 outline-none resize-none border border-border/40 focus:border-ring/60 focus:bg-card/80 transition-all"
          rows={3}
        />
        <div className="flex items-center justify-between mt-2.5 px-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-[12px] text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-foreground/5 transition-all"
          >
            {m.comments_cancel()}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="text-[12px] font-medium text-primary-foreground bg-primary/90 hover:bg-primary disabled:opacity-30 px-4 py-1.5 rounded-xl transition-all shadow-sm backdrop-blur-sm"
          >
            {m.comments_revise()}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;
