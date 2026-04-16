"use client";

import { useRef, useState } from "react";
import { MessageSquareWarning } from "lucide-react";

interface CritiqueModeButtonProps {
  active: boolean;
  onClick: () => void;
}

export function CritiqueModeButton({ active, onClick }: CritiqueModeButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      aria-label="Critique mode"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
        active
          ? "bg-blue-500/20 backdrop-blur-sm border-blue-400/50 text-blue-300 shadow-sm"
          : "bg-white/10 backdrop-blur-sm border-white/20 text-gray-400 hover:bg-white/15"
      }`}
    >
      <MessageSquareWarning className="w-4 h-4" />
      <span className="text-sm">Critique</span>
    </button>
  );
}