"use client";

import { forwardRef, useRef, useEffect } from "react";

interface PromptInputContainerProps {
  children: React.ReactNode;
  isGenerating?: boolean;
  className?: string;
}

export const PromptInputContainer = ({ 
  children, 
  isGenerating = false,
  className = ""
}: PromptInputContainerProps) => {
  return (
    <div
      className={`flex flex-col items-stretch rounded-[20px] px-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white/20 backdrop-blur-3xl border border-white/30 shadow-[0_8px_40px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.15)] pointer-events-auto ${
        isGenerating
          ? "w-[280px] py-2.5 px-3"
          : "w-[600px] max-w-[90vw] py-4 focus-within:shadow-[0_12px_48px_rgba(59,130,246,0.1),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.3)] focus-within:bg-white/30 focus-within:border-white/50"
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface PromptInputHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const PromptInputHeader = ({ 
  children, 
  className = ""
}: PromptInputHeaderProps) => {
  return (
    <div className={`flex items-center gap-2 mb-2 ${className}`}>
      {children}
    </div>
  );
};

interface PromptInputBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const PromptInputBody = ({ 
  children, 
  className = ""
}: PromptInputBodyProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
};

interface PromptInputFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const PromptInputFooter = ({ 
  children, 
  className = ""
}: PromptInputFooterProps) => {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      {children}
    </div>
  );
};

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

    useEffect(() => {
      const autoResize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const lineHeight = 22;
        const maxHeight = lineHeight * 6;
        el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
      };

      autoResize();
    }, [value]);

    return (
      <textarea
        ref={ref || textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="Prompt"
        className={`flex-1 px-0 py-2 text-[15px] text-gray-800 placeholder-gray-400/70 bg-transparent outline-none resize-none leading-[22px] ${className}`}
        style={{ maxHeight: 22 * 6 }}
      />
    );
  }
);

PromptInputTextarea.displayName = "PromptInputTextarea";