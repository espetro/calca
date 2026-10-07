import { type PropsWithChildren, forwardRef, useEffect, useRef } from "react";

import { Textarea } from "#/shared/components/ui/textarea";

interface PromptInputContainerProps extends PropsWithChildren {
  isGenerating?: boolean;
  className?: string;
}

export const PromptInputContainer = ({
  children,
  isGenerating = false,
  className = "",
}: PromptInputContainerProps) => (
  <div
    className={`flex flex-col items-stretch rounded-[20px] px-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-glass-bg/40 backdrop-blur-3xl border border-glass-border/50 shadow-glass pointer-events-auto ${
      isGenerating
        ? "w-[280px] py-2.5 px-3"
        : "w-[600px] max-w-[90vw] py-4 focus-within:bg-glass-bg/60 focus-within:border-glass-border"
    } ${className}`}
  >
    {children}
  </div>
);

interface PromptInputHeaderProps extends PropsWithChildren {
  className?: string;
}

export const PromptInputHeader = ({ children, className = "" }: PromptInputHeaderProps) => (
  <div className={`flex items-center gap-2 mb-2 ${className}`}>{children}</div>
);

interface PromptInputBodyProps extends PropsWithChildren {
  className?: string;
}

export const PromptInputBody = ({ children, className = "" }: PromptInputBodyProps) => (
  <div className={`flex items-center gap-2 ${className}`}>{children}</div>
);

interface PromptInputFooterProps extends PropsWithChildren {
  className?: string;
}

export const PromptInputFooter = ({ children, className = "" }: PromptInputFooterProps) => (
  <div className={`flex items-center justify-between gap-2 mt-2 ${className}`}>{children}</div>
);

interface PromptInputTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const PromptInputTextarea = forwardRef<HTMLTextAreaElement, PromptInputTextareaProps>(
  ({ value, onChange, placeholder, disabled = false, className = "", onKeyDown }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // oxlint-disable no-restricted-syntax -- DOM textarea resize reacting to value prop change. Cannot use derived state for DOM measurement.
    useEffect(() => {
      const autoResize = () => {
        const el = textareaRef.current;
        if (!el) {
          return;
        }
        el.style.height = "auto";
        const lineHeight = 22;
        const maxHeight = lineHeight * 6;
        el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
      };

      autoResize();
    }, [value]);

    return (
      <Textarea
        ref={ref || textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="Prompt"
        className={`flex-1 px-0 py-2 text-[15px] text-foreground placeholder:text-muted-foreground/70 bg-transparent outline-none resize-none leading-[22px] border-0 [field-sizing:fixed] focus-visible:ring-0 focus-visible:ring-offset-0 min-h-0 shadow-none focus-visible:border-0 ${className}`}
        style={{ maxHeight: 22 * 6 }}
      />
    );
  },
);

PromptInputTextarea.displayName = "PromptInputTextarea";
